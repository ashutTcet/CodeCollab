const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createLivekitToken } = require('../controllers/livekitController');

const router = express.Router();

router.post('/token', authMiddleware, createLivekitToken);

module.exports = router;
