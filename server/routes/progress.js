const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const {
  getMyProgress,
  getMyLanguageProgress,
} = require('../controllers/progressController');

const router = express.Router();

router.get('/', authMiddleware, requireRole('student'), getMyProgress);
router.get('/:language', authMiddleware, requireRole('student'), getMyLanguageProgress);

module.exports = router;
