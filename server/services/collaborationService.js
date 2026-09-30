const mongoose = require('mongoose');
const Y = require('yjs');
const Classroom = require('../models/Classroom');
const { ClassroomWorkspace, SUPPORTED_LANGUAGES } = require('../models/ClassroomWorkspace');
const { normalizeClassroomSubject, getStarterTemplate } = require('../config/classroomLanguages');

const CODE_TEXT_KEY = 'code';
const PERSIST_DEBOUNCE_MS = 1500;
const SESSION_TTL_MS = 2 * 60 * 1000;

class CollaborationService {
  constructor() {
    this.sessions = new Map();
  }

  roomName(classroomId) {
    return `classroom:${classroomId}`;
  }

  isSupportedLanguage(language) {
    return SUPPORTED_LANGUAGES.includes(normalizeClassroomSubject(language));
  }

  normalizeLanguage(language) {
    const normalized = normalizeClassroomSubject(language);
    if (!this.isSupportedLanguage(normalized)) {
      return null;
    }
    return normalized;
  }

  getStarterTemplate(language) {
    return getStarterTemplate(language);
  }

  /**
   * Check if the current Yjs document content matches any known starter template.
   */
  isStarterTemplate(content) {
    const trimmed = content.trim();
    if (!trimmed) {
      return true;
    }

    return SUPPORTED_LANGUAGES.some((subject) => getStarterTemplate(subject).trim() === trimmed);
  }

  async authorizeClassroomAccess({ classroomId, userId, role }) {
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      const error = new Error('Invalid classroom ID');
      error.status = 400;
      throw error;
    }

    const classroom = await Classroom.findById(classroomId)
      .select('name subject roomCode teacher students')
      .lean();

    if (!classroom) {
      const error = new Error('Classroom not found');
      error.status = 404;
      throw error;
    }

    const isTeacherOwner = role === 'teacher' && classroom.teacher.toString() === userId;
    const isStudentMember =
      role === 'student' &&
      classroom.students.some((studentId) => studentId.toString() === userId);

    if (!isTeacherOwner && !isStudentMember) {
      const error = new Error('You do not have access to this classroom workspace.');
      error.status = 403;
      throw error;
    }

    return classroom;
  }

  async ensureSession(classroomId, classroomSubject) {
    const existingSession = this.sessions.get(classroomId);
    if (existingSession) {
      if (existingSession.cleanupTimer) {
        clearTimeout(existingSession.cleanupTimer);
        existingSession.cleanupTimer = null;
      }
      return existingSession;
    }

    const workspace = await ClassroomWorkspace.findOne({ classroom: classroomId });
    const language =
      this.normalizeLanguage(classroomSubject) ||
      this.normalizeLanguage(workspace?.language) ||
      'JavaScript';

    const doc = new Y.Doc();
    const yText = doc.getText(CODE_TEXT_KEY);

    if (workspace?.ydocState?.length) {
      Y.applyUpdate(doc, new Uint8Array(workspace.ydocState), 'workspace-load');
    }

    if (yText.length === 0) {
      yText.insert(0, this.getStarterTemplate(language));
    }

    if (!workspace) {
      const initialState = Buffer.from(Y.encodeStateAsUpdate(doc));
      await ClassroomWorkspace.create({
        classroom: classroomId,
        language,
        ydocState: initialState,
        codeSnapshot: yText.toString(),
      });
    }

    const session = {
      classroomId,
      doc,
      language,
      participants: new Map(),
      socketIds: new Set(),
      persistTimer: null,
      cleanupTimer: null,
      dirty: false,
      lastUpdatedBy: null,
    };

    this.sessions.set(classroomId, session);
    return session;
  }

  getDocumentUpdate(session) {
    return Y.encodeStateAsUpdate(session.doc);
  }

  applyDocumentUpdate(session, update, updatedBy) {
    Y.applyUpdate(session.doc, update, 'remote-socket');
    session.lastUpdatedBy = updatedBy || null;
    session.dirty = true;
    this.schedulePersist(session.classroomId);
  }

  updateLanguage(session, language, updatedBy) {
    const normalized = this.normalizeLanguage(language);
    if (!normalized) {
      const error = new Error('Invalid language selection');
      error.status = 400;
      throw error;
    }

    if (session.language && session.language !== normalized) {
      const error = new Error('Classroom language is immutable');
      error.status = 400;
      throw error;
    }

    session.language = normalized;
    session.lastUpdatedBy = updatedBy || null;
    session.dirty = true;
    this.schedulePersist(session.classroomId);

    return normalized;
  }

  /**
   * Replace the Yjs document content with the new language's starter template,
   * but only if the current content is a known starter template (unchanged).
   * Returns the Yjs update to broadcast if content was replaced, or null.
   */
  replaceWithStarterTemplate(session, newLanguage) {
    const yText = session.doc.getText(CODE_TEXT_KEY);
    const currentContent = yText.toString();
    const isStarter = this.isStarterTemplate(currentContent);

    if (!isStarter) {
      // Content has been modified by the user — do not replace silently.
      return { replaced: false, update: null };
    }

    const newTemplate = this.getStarterTemplate(newLanguage);

    session.doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, newTemplate);
    }, 'language-switch');

    session.dirty = true;
    this.schedulePersist(session.classroomId);

    const update = Y.encodeStateAsUpdate(session.doc);
    return { replaced: true, update };
  }

  addParticipant(session, socketId, user) {
    session.socketIds.add(socketId);
    session.participants.set(socketId, {
      socketId,
      userId: user.id,
      name: user.name,
      role: user.role,
      cursor: null,
      joinedAt: new Date().toISOString(),
    });
  }

  updateCursor(session, socketId, cursor) {
    const participant = session.participants.get(socketId);
    if (!participant) {
      return;
    }

    participant.cursor = cursor;
    session.participants.set(socketId, participant);
  }

  removeParticipant(session, socketId) {
    session.participants.delete(socketId);
    session.socketIds.delete(socketId);
  }

  listParticipants(session) {
    const aggregate = new Map();

    for (const participant of session.participants.values()) {
      const existing = aggregate.get(participant.userId);

      if (!existing) {
        aggregate.set(participant.userId, {
          userId: participant.userId,
          name: participant.name,
          role: participant.role,
          cursor: participant.cursor,
          connectedSockets: 1,
          joinedAt: participant.joinedAt,
        });
      } else {
        existing.connectedSockets += 1;
        if (participant.cursor) {
          existing.cursor = participant.cursor;
        }
      }
    }

    return Array.from(aggregate.values());
  }

  schedulePersist(classroomId) {
    const session = this.sessions.get(classroomId);
    if (!session) {
      return;
    }

    if (session.persistTimer) {
      clearTimeout(session.persistTimer);
    }

    session.persistTimer = setTimeout(() => {
      this.persistSession(classroomId).catch(() => {
        // Keep the in-memory session and retry on next update.
      });
    }, PERSIST_DEBOUNCE_MS);
  }

  async persistSession(classroomId) {
    const session = this.sessions.get(classroomId);
    if (!session || !session.dirty) {
      return;
    }

    const state = Buffer.from(Y.encodeStateAsUpdate(session.doc));
    const codeText = session.doc.getText(CODE_TEXT_KEY).toString();

    await ClassroomWorkspace.findOneAndUpdate(
      { classroom: classroomId },
      {
        classroom: classroomId,
        language: session.language,
        ydocState: state,
        codeSnapshot: codeText,
        updatedBy: session.lastUpdatedBy || null,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    session.dirty = false;
  }

  scheduleCleanupIfEmpty(classroomId) {
    const session = this.sessions.get(classroomId);
    if (!session) {
      return;
    }

    if (session.socketIds.size > 0) {
      return;
    }

    if (session.cleanupTimer) {
      clearTimeout(session.cleanupTimer);
    }

    session.cleanupTimer = setTimeout(async () => {
      const latestSession = this.sessions.get(classroomId);
      if (!latestSession || latestSession.socketIds.size > 0) {
        return;
      }

      try {
        await this.persistSession(classroomId);
      } finally {
        latestSession.doc.destroy();
        this.sessions.delete(classroomId);
      }
    }, SESSION_TTL_MS);
  }

  async flushAll() {
    await Promise.all(
      Array.from(this.sessions.keys()).map((classroomId) => this.persistSession(classroomId))
    );
  }
}

module.exports = new CollaborationService();
