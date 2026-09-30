const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const aiController = require('../controllers/aiController');

router.post('/explain', authMiddleware, aiController.explainError);
router.post('/hint', authMiddleware, aiController.getHint);
router.post('/debug', authMiddleware, aiController.debugCode);
router.post('/chat', authMiddleware, aiController.chat);

module.exports = router;
