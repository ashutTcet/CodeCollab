const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Basic health check endpoint — confirms the API server is running.
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'CodeCollab API',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    integrations: {
      mongodb: 'not_connected',  // Planned: Phase 2
      socketio: 'not_initialized', // Planned: Phase 2
      judge0: 'not_configured',  // Planned: Phase 3
      ai_tutor: 'not_configured',  // Planned: Phase 3
    },
  });
});

module.exports = router;
