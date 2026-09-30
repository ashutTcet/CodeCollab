const { AccessToken } = require('livekit-server-sdk');
const mongoose = require('mongoose');
const collaborationService = require('../services/collaborationService');
const User = require('../models/User');

async function createLivekitToken(req, res, next) {
  try {
    const classroomId = String(req.body?.classroomId || '').trim();
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({ message: 'Invalid classroom ID' });
    }

    const serverUrl = String(process.env.LIVEKIT_URL || '').trim();
    const apiKey = String(process.env.LIVEKIT_API_KEY || '').trim();
    const apiSecret = String(process.env.LIVEKIT_API_SECRET || '').trim();

    if (!serverUrl || !apiKey || !apiSecret) {
      return res.status(500).json({
        message: 'LiveKit is not configured on the server.',
      });
    }

    await collaborationService.authorizeClassroomAccess({
      classroomId,
      userId: req.user.id,
      role: req.user.role,
    });

    const user = await User.findById(req.user.id).select('name').lean();
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const roomName = `classroom-${classroomId}`;
    const authenticatedUserId = `u_${req.user.id}`;
    const displayName = String(user.name || 'Participant');

    const token = new AccessToken(apiKey, apiSecret, {
      identity: authenticatedUserId,
      name: displayName,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    return res.status(200).json({
      token: jwt,
      serverUrl,
      roomName,
      participant: {
        id: authenticatedUserId,
        name: displayName,
      },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        message: error.message,
      });
    }

    console.error('[LiveKitTokenError]', error);
    return next(error);
  }
}

module.exports = {
  createLivekitToken,
};
