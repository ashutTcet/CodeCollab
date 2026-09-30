const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
const collaborationService = require('../services/collaborationService');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function toMessageResponse(messageDoc) {
  return {
    id: messageDoc._id,
    classroomId: messageDoc.classroom,
    message: messageDoc.message,
    type: messageDoc.type,
    createdAt: messageDoc.createdAt,
    updatedAt: messageDoc.updatedAt,
    sender: {
      id: messageDoc.sender?._id || null,
      name: messageDoc.sender?.name || 'Unknown',
      role: messageDoc.sender?.role || null,
    },
  };
}

async function getClassroomMessages(req, res, next) {
  try {
    const classroomId = String(req.params.classroomId || '').trim();
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({ message: 'Invalid classroom ID' });
    }

    await collaborationService.authorizeClassroomAccess({
      classroomId,
      userId: req.user.id,
      role: req.user.role,
    });

    const limit = Math.min(toPositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const beforeRaw = String(req.query.before || '').trim();

    const filter = {
      classroom: classroomId,
      type: 'text',
    };

    if (beforeRaw) {
      const beforeDate = new Date(beforeRaw);
      if (Number.isNaN(beforeDate.getTime())) {
        return res.status(400).json({ message: 'Invalid before cursor' });
      }
      filter.createdAt = { $lt: beforeDate };
    }

    const docs = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name role')
      .lean();

    const messages = docs.reverse().map(toMessageResponse);

    return res.status(200).json({
      messages,
      pagination: {
        limit,
        hasMore: docs.length === limit,
        nextBefore: docs.length > 0 ? docs[docs.length - 1].createdAt : null,
      },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        message: error.status >= 500 ? 'Unable to load classroom messages.' : error.message,
      });
    }

    return next(error);
  }
}

module.exports = {
  getClassroomMessages,
};
