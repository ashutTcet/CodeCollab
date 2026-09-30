import { io } from 'socket.io-client';
import * as Y from 'yjs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8080';
const API_BASE = `${BASE_URL}/api`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toUint8Array(payload) {
  if (!payload) return null;
  if (payload instanceof Uint8Array) return payload;
  if (Array.isArray(payload)) return Uint8Array.from(payload);
  if (payload.type === 'Buffer' && Array.isArray(payload.data)) return Uint8Array.from(payload.data);
  if (payload instanceof ArrayBuffer) return new Uint8Array(payload);
  return null;
}

async function waitFor(predicate, timeoutMs, label) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) {
      return;
    }
    await delay(50);
  }
  throw new Error(`Timeout waiting for ${label}`);
}

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

async function registerUser({ name, email, role }) {
  const password = 'Password123!';
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      name,
      email,
      password,
      confirmPassword: password,
      role,
    },
  });

  return {
    token: data.token,
    user: data.user,
  };
}

class CollabClient {
  constructor({ token, userName, classroomId }) {
    this.token = token;
    this.userName = userName;
    this.classroomId = classroomId;
    this.socket = null;
    this.ydoc = null;
    this.ytext = null;
    this.language = null;
    this.participants = [];
    this.lastError = null;
    this.updateHandler = null;
    this.connected = false;
  }

  async connectAndJoin() {
    this.socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      auth: { token: this.token },
      withCredentials: true,
      extraHeaders: {
        Origin: 'http://localhost:5173',
      },
      reconnection: true,
    });

    this.socket.on('classroom:error', (payload = {}) => {
      this.lastError = payload.message || 'Unknown classroom error';
    });

    this.socket.on('presence:update', (payload = {}) => {
      if (payload.classroomId === this.classroomId) {
        this.participants = Array.isArray(payload.participants) ? payload.participants : [];
      }
    });

    this.socket.on('language:update', (payload = {}) => {
      if (payload.classroomId === this.classroomId) {
        this.language = payload.language;
      }
    });

    this.socket.on('document:update', (payload = {}) => {
      if (!this.ydoc || payload.classroomId !== this.classroomId) {
        return;
      }

      const update = toUint8Array(payload.update);
      if (update) {
        Y.applyUpdate(this.ydoc, update, 'remote');
      }
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket connect timeout')), 6000);
      this.socket.on('connect', () => {
        clearTimeout(timeout);
        this.connected = true;
        resolve();
      });
      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Socket authentication/connect failed: ${error.message}`));
      });
    });

    this.socket.emit('classroom:join', { classroomId: this.classroomId });

    const syncPayload = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Document sync timeout')), 7000);
      const onSync = (payload = {}) => {
        if (payload.classroomId !== this.classroomId) {
          return;
        }
        clearTimeout(timeout);
        this.socket.off('document:sync', onSync);
        resolve(payload);
      };
      this.socket.on('document:sync', onSync);
    });

    const update = toUint8Array(syncPayload.update);
    if (!update) {
      throw new Error('Invalid sync payload');
    }

    this.language = syncPayload.language;

    this.ydoc = new Y.Doc();
    Y.applyUpdate(this.ydoc, update, 'initial-sync');
    this.ytext = this.ydoc.getText('code');

    this.updateHandler = (nextUpdate, origin) => {
      if (origin === 'remote' || origin === 'initial-sync') {
        return;
      }

      this.socket.emit('document:update', {
        classroomId: this.classroomId,
        update: nextUpdate,
      });
    };

    this.ydoc.on('update', this.updateHandler);
  }

  getText() {
    return this.ytext ? this.ytext.toString() : '';
  }

  applyEdit(mutator) {
    if (!this.ytext) {
      throw new Error('Document not ready');
    }

    mutator(this.ytext);
  }

  sendCursor(cursor) {
    this.socket.emit('cursor:update', {
      classroomId: this.classroomId,
      cursor,
    });
  }

  setLanguage(language) {
    this.socket.emit('language:update', {
      classroomId: this.classroomId,
      language,
    });
  }

  disconnect() {
    if (this.ydoc && this.updateHandler) {
      this.ydoc.off('update', this.updateHandler);
    }
    if (this.ydoc) {
      this.ydoc.destroy();
    }
    if (this.socket) {
      this.socket.emit('classroom:leave', { classroomId: this.classroomId });
      this.socket.disconnect();
    }
    this.connected = false;
  }
}

async function main() {
  const stamp = Date.now();

  const teacher = await registerUser({
    name: 'Teacher Phase4',
    email: `teacher.phase4.${stamp}@test.local`,
    role: 'teacher',
  });

  const studentA = await registerUser({
    name: 'Student A',
    email: `student.a.${stamp}@test.local`,
    role: 'student',
  });

  const studentB = await registerUser({
    name: 'Student B',
    email: `student.b.${stamp}@test.local`,
    role: 'student',
  });

  const studentC = await registerUser({
    name: 'Student C',
    email: `student.c.${stamp}@test.local`,
    role: 'student',
  });

  const outsider = await registerUser({
    name: 'Outsider',
    email: `outsider.${stamp}@test.local`,
    role: 'student',
  });

  const classroomA = await apiRequest('/classrooms', {
    method: 'POST',
    token: teacher.token,
    body: { name: 'Classroom A', subject: 'Algorithms', description: 'Realtime room A' },
  });

  const classroomB = await apiRequest('/classrooms', {
    method: 'POST',
    token: teacher.token,
    body: { name: 'Classroom B', subject: 'Systems', description: 'Realtime room B' },
  });

  await apiRequest('/classrooms/join', {
    method: 'POST',
    token: studentA.token,
    body: { roomCode: classroomA.classroom.roomCode },
  });

  await apiRequest('/classrooms/join', {
    method: 'POST',
    token: studentB.token,
    body: { roomCode: classroomA.classroom.roomCode },
  });

  await apiRequest('/classrooms/join', {
    method: 'POST',
    token: studentC.token,
    body: { roomCode: classroomB.classroom.roomCode },
  });

  const teacherInA = new CollabClient({ token: teacher.token, userName: teacher.user.name, classroomId: classroomA.classroom.id });
  const studentInA = new CollabClient({ token: studentA.token, userName: studentA.user.name, classroomId: classroomA.classroom.id });
  const thirdInA = new CollabClient({ token: studentB.token, userName: studentB.user.name, classroomId: classroomA.classroom.id });
  const studentInB = new CollabClient({ token: studentC.token, userName: studentC.user.name, classroomId: classroomB.classroom.id });

  await teacherInA.connectAndJoin();
  await studentInA.connectAndJoin();
  await thirdInA.connectAndJoin();
  await studentInB.connectAndJoin();

  await waitFor(() => teacherInA.participants.length >= 3, 6000, 'presence in classroom A');

  teacherInA.applyEdit((text) => {
    text.insert(text.length, '\n// teacher update A');
  });

  await waitFor(
    () => studentInA.getText().includes('// teacher update A') && thirdInA.getText().includes('// teacher update A'),
    6000,
    'teacher->students synchronization'
  );

  studentInA.applyEdit((text) => {
    text.insert(0, '// student update A\n');
  });

  await waitFor(
    () => teacherInA.getText().startsWith('// student update A') && thirdInA.getText().startsWith('// student update A'),
    6000,
    'student->teacher synchronization'
  );

  teacherInA.applyEdit((text) => {
    text.insert(0, 'A1\n');
  });
  studentInA.applyEdit((text) => {
    text.insert(text.length, '\nA2');
  });

  await waitFor(
    () => {
      const text = thirdInA.getText();
      return text.includes('A1') && text.includes('A2');
    },
    6000,
    'concurrent edits preserved'
  );

  teacherInA.sendCursor({ startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 1 });
  await waitFor(
    () => studentInA.participants.some((p) => p.name === teacher.user.name && p.cursor && p.cursor.startLineNumber === 2),
    5000,
    'cursor presence update'
  );

  teacherInA.setLanguage('python');
  await waitFor(() => studentInA.language === 'python' && thirdInA.language === 'python', 5000, 'language sync');

  const participantsBeforeLeave = teacherInA.participants.length;
  thirdInA.disconnect();
  await waitFor(() => teacherInA.participants.length < participantsBeforeLeave, 5000, 'presence removal on disconnect');

  const rejoinedThird = new CollabClient({ token: studentB.token, userName: studentB.user.name, classroomId: classroomA.classroom.id });
  await rejoinedThird.connectAndJoin();
  await waitFor(() => teacherInA.participants.length >= 3, 6000, 'presence restore on reconnect');

  const snapshotA = teacherInA.getText();

  const reloadStudentA = new CollabClient({ token: studentA.token, userName: studentA.user.name, classroomId: classroomA.classroom.id });
  studentInA.disconnect();
  await reloadStudentA.connectAndJoin();
  await waitFor(() => reloadStudentA.getText() === snapshotA, 6000, 'document persistence after reconnect');

  teacherInA.applyEdit((text) => {
    text.insert(text.length, '\nA-only-change');
  });
  await waitFor(() => reloadStudentA.getText().includes('A-only-change'), 6000, 'classroom A self sync');
  await delay(500);

  if (studentInB.getText().includes('A-only-change')) {
    throw new Error('Cross-classroom leak detected from A to B');
  }

  studentInB.applyEdit((text) => {
    text.insert(text.length, '\nB-only-change');
  });

  await delay(600);
  if (teacherInA.getText().includes('B-only-change')) {
    throw new Error('Cross-classroom leak detected from B to A');
  }

  const unauthorizedSocket = io(BASE_URL, {
    transports: ['websocket', 'polling'],
    auth: { token: outsider.token },
    withCredentials: true,
    extraHeaders: {
      Origin: 'http://localhost:5173',
    },
  });
  let unauthorizedMessage = '';
  await new Promise((resolve) => {
    unauthorizedSocket.on('connect', () => {
      unauthorizedSocket.emit('classroom:join', { classroomId: classroomA.classroom.id });
    });
    unauthorizedSocket.on('classroom:error', (payload = {}) => {
      unauthorizedMessage = payload.message || '';
      resolve();
    });
    setTimeout(resolve, 4000);
  });
  unauthorizedSocket.disconnect();

  if (!unauthorizedMessage.toLowerCase().includes('access')) {
    throw new Error('Unauthorized classroom join was not rejected correctly');
  }

  const anonymousSocket = io(BASE_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    extraHeaders: {
      Origin: 'http://localhost:5173',
    },
  });
  let anonymousFailed = false;
  await new Promise((resolve) => {
    anonymousSocket.on('connect_error', () => {
      anonymousFailed = true;
      resolve();
    });
    setTimeout(resolve, 4000);
  });
  anonymousSocket.disconnect();

  if (!anonymousFailed) {
    throw new Error('Unauthenticated socket connection should fail');
  }

  teacherInA.disconnect();
  reloadStudentA.disconnect();
  rejoinedThird.disconnect();
  studentInB.disconnect();

  console.log('PHASE4_REALTIME_TEST_SUMMARY');
  console.log(`classroomA=${classroomA.classroom.id}`);
  console.log(`classroomB=${classroomB.classroom.id}`);
  console.log('sync_teacher_to_students=pass');
  console.log('sync_students_to_teacher=pass');
  console.log('concurrent_edits=pass');
  console.log('cursor_presence=pass');
  console.log('language_sync=pass');
  console.log('presence_disconnect_reconnect=pass');
  console.log('document_persistence_rejoin=pass');
  console.log('unauthorized_socket_join=pass');
  console.log('unauthenticated_socket_rejected=pass');
  console.log('multi_classroom_isolation=pass');
}

main().catch((error) => {
  console.error('PHASE4_REALTIME_TEST_FAILED');
  console.error(error.message);
  process.exit(1);
});
