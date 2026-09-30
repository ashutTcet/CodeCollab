const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const { getStudentDashboard } = require('../controllers/studentController');

const router = express.Router();

router.get('/dashboard', authMiddleware, requireRole('student'), getStudentDashboard);

module.exports = router;
