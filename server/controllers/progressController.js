const mongoose = require('mongoose');
const Classroom = require('../models/Classroom');
const progressService = require('../services/progressService');
const { SUPPORTED_CLASSROOM_SUBJECTS, normalizeClassroomSubject } = require('../config/classroomLanguages');

function formatLastActive(lastActiveAt) {
  if (!lastActiveAt) {
    return null;
  }

  return lastActiveAt;
}

function formatStudentProgress(progress) {
  return {
    language: progress.language,
    problemsAttempted: progress.problemsAttempted || 0,
    problemsSolved: progress.problemsSolved || 0,
    submissions: progress.submissions || 0,
    acceptedSubmissions: progress.acceptedSubmissions || 0,
    compilationErrors: progress.compilationErrors || 0,
    runtimeErrors: progress.runtimeErrors || 0,
    codingSessions: progress.codingSessions || 0,
    codingTimeMinutes: progress.codingTimeMinutes || 0,
    lastActiveAt: formatLastActive(progress.lastActiveAt),
    hasActivity: Boolean(progress.hasActivity),
  };
}

function formatSubmission(submission) {
  return {
    id: submission._id,
    classroomId: submission.classroom,
    language: submission.language,
    status: submission.status,
    statusLabel: submission.statusLabel,
    judge0LanguageId: submission.judge0LanguageId,
    executionTime: submission.executionTime,
    memory: submission.memory,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

async function getMyProgress(req, res, next) {
  try {
    const progress = await progressService.getStudentProgressMap(req.user.id, SUPPORTED_CLASSROOM_SUBJECTS);
    const recentSubmissions = await progressService.getRecentSubmissions(req.user.id, null, 10);

    return res.status(200).json({
      progress: progress.map(formatStudentProgress),
      recentSubmissions: recentSubmissions.map(formatSubmission),
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyLanguageProgress(req, res, next) {
  try {
    const language = normalizeClassroomSubject(req.params.language);
    if (!language) {
      return res.status(400).json({ message: 'Unsupported language.' });
    }

    const progress = await progressService.getStudentProgress(req.user.id, language);
    const recentSubmissions = await progressService.getRecentSubmissions(req.user.id, language, 10);

    return res.status(200).json({
      progress: formatStudentProgress(progress),
      recentSubmissions: recentSubmissions.map(formatSubmission),
    });
  } catch (error) {
    return next(error);
  }
}

async function authorizeTeacherClassroom(classroomId, userId) {
  if (!mongoose.Types.ObjectId.isValid(classroomId)) {
    const error = new Error('Invalid classroom ID');
    error.status = 400;
    throw error;
  }

  const classroom = await Classroom.findById(classroomId)
    .populate('students', 'name email createdAt')
    .select('name subject teacher students createdAt updatedAt')
    .lean();

  if (!classroom) {
    const error = new Error('Classroom not found');
    error.status = 404;
    throw error;
  }

  if (classroom.teacher.toString() !== userId) {
    const error = new Error('You do not have access to this classroom.');
    error.status = 403;
    throw error;
  }

  return classroom;
}

async function getClassroomProgress(req, res, next) {
  try {
    const classroom = await authorizeTeacherClassroom(req.params.classroomId, req.user.id);
    const language = normalizeClassroomSubject(classroom.subject);

    const progressRows = await Promise.all(
      classroom.students.map(async (student) => {
        const progress = await progressService.getStudentProgress(student._id.toString(), language);
        return {
          student: {
            id: student._id,
            name: student.name,
            email: student.email,
          },
          progress: formatStudentProgress(progress),
        };
      })
    );

    return res.status(200).json({
      classroom: {
        id: classroom._id,
        name: classroom.name,
        subject: classroom.subject,
      },
      students: progressRows,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    return next(error);
  }
}

async function getClassroomStudentProgress(req, res, next) {
  try {
    const classroom = await authorizeTeacherClassroom(req.params.classroomId, req.user.id);
    const studentId = String(req.params.studentId || '').trim();

    const student = classroom.students.find((entry) => entry._id.toString() === studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student is not enrolled in this classroom.' });
    }

    const progress = await progressService.getStudentProgress(studentId, classroom.subject);
    const recentSubmissions = await progressService.getRecentSubmissions(studentId, classroom.subject, 10);

    return res.status(200).json({
      classroom: {
        id: classroom._id,
        name: classroom.name,
        subject: classroom.subject,
      },
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
      },
      progress: formatStudentProgress(progress),
      recentSubmissions: recentSubmissions.map(formatSubmission),
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    return next(error);
  }
}

module.exports = {
  getMyProgress,
  getMyLanguageProgress,
  getClassroomProgress,
  getClassroomStudentProgress,
};
