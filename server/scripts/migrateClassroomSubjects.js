const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const Classroom = require('../models/Classroom');
const { normalizeClassroomSubject, SUPPORTED_CLASSROOM_SUBJECTS } = require('../config/classroomLanguages');

async function listMissingSubjects() {
  const classrooms = await Classroom.find({
    $or: [
      { subject: { $exists: false } },
      { subject: null },
      { subject: '' },
      { subject: { $nin: SUPPORTED_CLASSROOM_SUBJECTS } },
    ],
  })
    .select('name subject roomCode teacher createdAt updatedAt')
    .lean();

  if (classrooms.length === 0) {
    console.log('No classrooms need subject migration.');
    return;
  }

  console.log('Classrooms needing explicit subject assignment:');
  classrooms.forEach((classroom) => {
    console.log(
      `- ${classroom._id} | ${classroom.name} | current subject: ${classroom.subject || '(missing)'} | room: ${classroom.roomCode}`
    );
  });
}

async function setSubject(classroomId, subject) {
  if (!mongoose.Types.ObjectId.isValid(classroomId)) {
    throw new Error('Invalid classroom ID');
  }

  const normalized = normalizeClassroomSubject(subject);
  if (!normalized) {
    throw new Error(`Invalid subject. Choose one of: ${SUPPORTED_CLASSROOM_SUBJECTS.join(', ')}`);
  }

  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    throw new Error('Classroom not found');
  }

  classroom.subject = normalized;
  await classroom.save();
  console.log(`Updated ${classroom.name} (${classroom._id}) -> ${normalized}`);
}

async function main() {
  const [command, classroomId, subject] = process.argv.slice(2);

  await connectDB();

  try {
    if (command === 'list') {
      await listMissingSubjects();
      return;
    }

    if (command === 'set') {
      if (!classroomId || !subject) {
        throw new Error('Usage: node scripts/migrateClassroomSubjects.js set <classroomId> <subject>');
      }

      await setSubject(classroomId, subject);
      return;
    }

    console.log('Usage:');
    console.log('  node scripts/migrateClassroomSubjects.js list');
    console.log('  node scripts/migrateClassroomSubjects.js set <classroomId> <subject>');
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
