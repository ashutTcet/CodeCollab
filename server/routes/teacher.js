const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const { getTeacherDashboard } = require('../controllers/teacherController');

const router = express.Router();

router.get('/dashboard', authMiddleware, requireRole('teacher'), getTeacherDashboard);

module.exports = router;
