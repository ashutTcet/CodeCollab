const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const executeRateLimit = require('../middleware/executeRateLimit');
const {
  executeCode,
  getSupportedExecutionLanguages,
} = require('../controllers/codeController');

const router = express.Router();

router.get('/languages', authMiddleware, getSupportedExecutionLanguages);
router.post('/execute', authMiddleware, executeRateLimit, executeCode);

module.exports = router;
