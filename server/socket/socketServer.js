const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const collaborationService = require('../services/collaborationService');
const User = require('../models/User');

function extractTokenFromSocket(socket) {
  const cookieHeader = socket.handshake.headers?.cookie || '';
  const parseCookieHeader =
    typeof cookie.parse === 'function'
      ? cookie.parse
      : typeof cookie.parseCookie === 'function'
        ? cookie.parseCookie
        : () => ({});

  const parsedCookies = parseCookieHeader(cookieHeader || '');
  const cookieToken = parsedCookies.token;

  if (cookieToken) {
    return cookieToken;
  }

  const authToken = socket.handshake.auth?.token;
  if (authToken) {
    return authToken;
  }

  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

function sanitizeCursor(cursor) {
  if (!cursor || typeof cursor !== 'object') {
    return null;
  }

  const startLineNumber = Number(cursor.startLineNumber);
  const startColumn = Number(cursor.startColumn);
  const endLineNumber = Number(cursor.endLineNumber || cursor.startLineNumber);
  const endColumn = Number(cursor.endColumn || cursor.startColumn);

  const validNumbers = [startLineNumber, startColumn, endLineNumber, endColumn].every(
    (value) => Number.isFinite(value) && value > 0
  );

  if (!validNumbers) {
    return null;
  }

  return {
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
  };
}

function normalizeIncomingUpdate(updatePayload) {
  if (!updatePayload) {
    return null;
  }

  if (updatePayload instanceof Uint8Array) {
    return updatePayload;
  }

  if (Buffer.isBuffer(updatePayload)) {
    return new Uint8Array(updatePayload);
  }

  if (Array.isArray(updatePayload)) {
    return Uint8Array.from(updatePayload);
  }

  if (updatePayload.type === 'Buffer' && Array.isArray(updatePayload.data)) {
    return Uint8Array.from(updatePayload.data);
  }

  return null;
}

function emitClassroomError(socket, message) {
  socket.emit('classroom:error', { message });
}

async function handleLeave(io, socket) {
  const activeClassroomId = socket.data.classroomId;
  if (!activeClassroomId) {
    return;
  }

  const roomName = collaborationService.roomName(activeClassroomId);
  const session = collaborationService.sessions.get(activeClassroomId);

  if (session) {
    collaborationService.removeParticipant(session, socket.id);
    io.to(roomName).emit('presence:update', {
      classroomId: activeClassroomId,
      participants: collaborationService.listParticipants(session),
    });

    collaborationService.scheduleCleanupIfEmpty(activeClassroomId);
  }

  socket.leave(roomName);
  socket.data.classroomId = null;
}

async function initializeSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = extractTokenFromSocket(socket);

      if (!token) {
        const authError = new Error('Authentication required');
        authError.data = { status: 401 };
        return next(authError);
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        const configError = new Error('Authentication is not configured');
        configError.data = { status: 500 };
        return next(configError);
      }

      const payload = jwt.verify(token, jwtSecret);
      const user = await User.findById(payload.sub).select('name email role').lean();

      if (!user) {
        const userError = new Error('User not found');
        userError.data = { status: 401 };
        return next(userError);
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };

      return next();
    } catch (error) {
      console.error('[SocketAuthError]', error.message);

      const isTokenError =
        error.name === 'TokenExpiredError' ||
        error.name === 'JsonWebTokenError' ||
        error.name === 'NotBeforeError';

      const authError = new Error(isTokenError ? 'Invalid authentication token' : 'Socket authentication failed');
      authError.data = { status: 401 };
      return next(authError);
    }
  });

  io.on('connection', (socket) => {
    socket.data.classroomId = null;

    socket.on('classroom:join', async (payload = {}) => {
      try {
        const classroomId = String(payload.classroomId || '').trim();
        if (!classroomId) {
          emitClassroomError(socket, 'Classroom ID is required.');
          return;
        }

        await collaborationService.authorizeClassroomAccess({
          classroomId,
          userId: socket.user.id,
          role: socket.user.role,
        });

        if (socket.data.classroomId && socket.data.classroomId !== classroomId) {
          await handleLeave(io, socket);
        }

        const session = await collaborationService.ensureSession(classroomId);
        const roomName = collaborationService.roomName(classroomId);

        socket.join(roomName);
        socket.data.classroomId = classroomId;
        collaborationService.addParticipant(session, socket.id, socket.user);

        socket.emit('document:sync', {
          classroomId,
          language: session.language,
          update: Buffer.from(collaborationService.getDocumentUpdate(session)),
        });

        io.to(roomName).emit('presence:update', {
          classroomId,
          participants: collaborationService.listParticipants(session),
        });
      } catch (error) {
        const status = error.status || 500;
        const message = status >= 500 ? 'Failed to join classroom workspace.' : error.message;
        emitClassroomError(socket, message);
      }
    });

    socket.on('classroom:leave', async () => {
      await handleLeave(io, socket);
    });

    socket.on('document:update', async (payload = {}) => {
      try {
        const classroomId = String(payload.classroomId || '').trim();
        const update = normalizeIncomingUpdate(payload.update);

        if (!classroomId || !update || socket.data.classroomId !== classroomId) {
          return;
        }

        const session = collaborationService.sessions.get(classroomId);
        if (!session) {
          return;
        }

        collaborationService.applyDocumentUpdate(session, update, socket.user.id);

        socket.to(collaborationService.roomName(classroomId)).emit('document:update', {
          classroomId,
          update: Buffer.from(update),
        });
      } catch (_error) {
        emitClassroomError(socket, 'Failed to synchronize document update.');
      }
    });

    socket.on('cursor:update', (payload = {}) => {
      const classroomId = String(payload.classroomId || '').trim();
      if (!classroomId || socket.data.classroomId !== classroomId) {
        return;
      }

      const cursor = sanitizeCursor(payload.cursor);
      const session = collaborationService.sessions.get(classroomId);
      if (!session) {
        return;
      }

      collaborationService.updateCursor(session, socket.id, cursor);

      io.to(collaborationService.roomName(classroomId)).emit('presence:update', {
        classroomId,
        participants: collaborationService.listParticipants(session),
      });
    });

    socket.on('language:update', async (payload = {}) => {
      try {
        const classroomId = String(payload.classroomId || '').trim();
        if (!classroomId || socket.data.classroomId !== classroomId) {
          return;
        }

        const session = collaborationService.sessions.get(classroomId);
        if (!session) {
          return;
        }

        const language = collaborationService.updateLanguage(
          session,
          payload.language,
          socket.user.id
        );

        io.to(collaborationService.roomName(classroomId)).emit('language:update', {
          classroomId,
          language,
          updatedBy: {
            id: socket.user.id,
            name: socket.user.name,
            role: socket.user.role,
          },
        });
      } catch (error) {
        const message = error.status && error.status < 500
          ? error.message
          : 'Failed to update workspace language.';
        emitClassroomError(socket, message);
      }
    });

    socket.on('disconnect', async () => {
      await handleLeave(io, socket);
    });
  });

  return io;
}

module.exports = {
  initializeSocketServer,
};
