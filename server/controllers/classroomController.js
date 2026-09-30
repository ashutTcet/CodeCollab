const mongoose = require('mongoose');
const Classroom = require('../models/Classroom');
const { generateRoomCode } = require('../utils/roomCode');
const { normalizeClassroomSubject, SUPPORTED_CLASSROOM_SUBJECTS } = require('../config/classroomLanguages');

function getEntityId(entity) {
  if (!entity) return null;
  if (typeof entity === 'string') return entity;
  if (entity._id) return entity._id.toString();
  if (typeof entity.toString === 'function') return entity.toString();
  return null;
}

function sanitizeClassroomSummary(classroom) {
  const isTeacherPopulated =
    classroom.teacher &&
    typeof classroom.teacher === 'object' &&
    Object.prototype.hasOwnProperty.call(classroom.teacher, '_id');

  return {
    id: classroom._id,
    name: classroom.name,
    subject: classroom.subject,
    description: classroom.description,
    roomCode: classroom.roomCode,
    teacher: isTeacherPopulated
      ? {
          id: getEntityId(classroom.teacher),
          name: classroom.teacher.name,
          email: classroom.teacher.email,
        }
      : getEntityId(classroom.teacher),
    studentCount: Array.isArray(classroom.students) ? classroom.students.length : classroom.studentCount || 0,
    createdAt: classroom.createdAt,
    updatedAt: classroom.updatedAt,
  };
}

async function createUniqueRoomCode(subject) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = generateRoomCode(subject);
    const existing = await Classroom.findOne({ roomCode: candidate }).select('_id');

    if (!existing) {
      return candidate;
    }
  }

  throw new Error('Could not generate a unique room code');
}

function validateCreatePayload(body) {
  const name = String(body.name || '').trim();
  const subject = normalizeClassroomSubject(body.subject);
  const description = String(body.description || '').trim();

  if (!name) {
    return { error: 'Classroom name is required' };
  }

  if (!subject) {
    return { error: `Subject is required and must be one of: ${SUPPORTED_CLASSROOM_SUBJECTS.join(', ')}` };
  }

  if (name.length > 100) {
    return { error: 'Classroom name must be 100 characters or fewer' };
  }

  if (description.length > 500) {
    return { error: 'Description must be 500 characters or fewer' };
  }

  return {
    name,
    subject,
    description,
  };
}

function normalizeRoomCode(input) {
  return String(input || '').trim().toUpperCase();
}

async function createClassroom(req, res, next) {
  try {
    const payload = validateCreatePayload(req.body);

    if (payload.error) {
      return res.status(400).json({ message: payload.error });
    }

    const roomCode = await createUniqueRoomCode(payload.subject);

    const classroom = await Classroom.create({
      name: payload.name,
      subject: payload.subject,
      description: payload.description,
      roomCode,
      teacher: req.user.id,
      students: [],
    });

    return res.status(201).json({
      message: 'Classroom created successfully',
      classroom: sanitizeClassroomSummary(classroom),
    });
  } catch (error) {
    return next(error);
  }
}

async function getTeacherClassrooms(req, res, next) {
  try {
    const classrooms = await Classroom.find({ teacher: req.user.id })
      .sort({ createdAt: -1 })
      .select('name subject description roomCode students createdAt updatedAt');

    return res.status(200).json({
      classrooms: classrooms.map(sanitizeClassroomSummary),
    });
  } catch (error) {
    return next(error);
  }
}

async function joinClassroom(req, res, next) {
  try {
    const roomCode = normalizeRoomCode(req.body.roomCode);

    if (!roomCode) {
      return res.status(400).json({ message: 'Room code is required' });
    }

    const classroom = await Classroom.findOne({ roomCode });

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found. Check the code and try again.' });
    }

    const isAlreadyEnrolled = classroom.students.some(
      (studentId) => studentId.toString() === req.user.id
    );

    if (isAlreadyEnrolled) {
      return res.status(409).json({ message: 'You are already enrolled in this classroom.' });
    }

    classroom.students.push(req.user.id);
    await classroom.save();

    await classroom.populate('teacher', 'name email');

    return res.status(200).json({
      message: 'Joined classroom successfully',
      classroom: sanitizeClassroomSummary(classroom),
    });
  } catch (error) {
    return next(error);
  }
}

async function getStudentClassrooms(req, res, next) {
  try {
    const classrooms = await Classroom.find({ students: req.user.id })
      .sort({ updatedAt: -1 })
      .populate('teacher', 'name email')
      .select('name subject description roomCode teacher students createdAt updatedAt');

    return res.status(200).json({
      classrooms: classrooms.map(sanitizeClassroomSummary),
    });
  } catch (error) {
    return next(error);
  }
}

function canAccessClassroom(classroom, userId, role) {
  if (role === 'teacher') {
    return getEntityId(classroom.teacher) === userId;
  }

  if (role === 'student') {
    return classroom.students.some((student) => getEntityId(student) === userId);
  }

  return false;
}

async function getClassroomDetails(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid classroom ID' });
    }

    const classroom = await Classroom.findById(id)
      .populate('teacher', 'name email')
      .populate('students', 'name email createdAt')
      .select('name subject description roomCode teacher students createdAt updatedAt');

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (!canAccessClassroom(classroom, req.user.id, req.user.role)) {
      return res.status(403).json({ message: "You don't have access to this classroom." });
    }

    const response = {
      id: classroom._id,
      name: classroom.name,
      subject: classroom.subject,
      description: classroom.description,
      roomCode: classroom.roomCode,
      teacher: {
        id: classroom.teacher._id,
        name: classroom.teacher.name,
        email: classroom.teacher.email,
      },
      studentCount: classroom.students.length,
      createdAt: classroom.createdAt,
      updatedAt: classroom.updatedAt,
    };

    if (req.user.role === 'teacher') {
      response.students = classroom.students.map((student) => ({
        id: student._id,
        name: student.name,
        email: student.email,
      }));
    }

    return res.status(200).json({ classroom: response });
  } catch (error) {
    return next(error);
  }
}

async function getClassroomStudents(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid classroom ID' });
    }

    const classroom = await Classroom.findById(id)
      .populate('students', 'name email createdAt')
      .select('teacher students');

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "You don't have access to this classroom." });
    }

    return res.status(200).json({
      students: classroom.students.map((student) => ({
        id: student._id,
        name: student.name,
        email: student.email,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createClassroom,
  getTeacherClassrooms,
  joinClassroom,
  getStudentClassrooms,
  getClassroomDetails,
  getClassroomStudents,
};
