const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const {
  createClassroom,
  getTeacherClassrooms,
  joinClassroom,
  getStudentClassrooms,
  getClassroomDetails,
  getClassroomStudents,
} = require('../controllers/classroomController');
const { getClassroomMessages } = require('../controllers/chatController');
const {
  getClassroomProgress,
  getClassroomStudentProgress,
} = require('../controllers/progressController');

const router = express.Router();

router.post('/', authMiddleware, requireRole('teacher'), createClassroom);
router.get('/teacher', authMiddleware, requireRole('teacher'), getTeacherClassrooms);
router.post('/join', authMiddleware, requireRole('student'), joinClassroom);
router.get('/student', authMiddleware, requireRole('student'), getStudentClassrooms);
router.get('/:classroomId/messages', authMiddleware, getClassroomMessages);
router.get('/:id/students', authMiddleware, requireRole('teacher'), getClassroomStudents);
router.get('/:classroomId/progress', authMiddleware, requireRole('teacher'), getClassroomProgress);
router.get('/:classroomId/progress/:studentId', authMiddleware, requireRole('teacher'), getClassroomStudentProgress);
router.get('/:id', authMiddleware, getClassroomDetails);

module.exports = router;
