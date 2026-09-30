const Submission = require('../models/Submission');
const StudentProgress = require('../models/StudentProgress');
const { normalizeClassroomSubject } = require('../config/classroomLanguages');

function isAcceptedStatus(status) {
  return String(status || '').toLowerCase() === 'accepted';
}

function isCompilationError(status) {
  const normalized = String(status || '').toLowerCase();
  return normalized === 'compilation_error' || normalized === 'compile_error';
}

function isRuntimeError(status) {
  const normalized = String(status || '').toLowerCase();
  return normalized === 'runtime_error' || normalized === 'time_limit_exceeded' || normalized === 'memory_limit_exceeded';
}

function toLanguageRecord(language, progressDoc) {
  return {
    language,
    problemsAttempted: progressDoc?.problemsAttempted || 0,
    problemsSolved: progressDoc?.problemsSolved || 0,
    submissions: progressDoc?.submissions || 0,
    acceptedSubmissions: progressDoc?.acceptedSubmissions || 0,
    compilationErrors: progressDoc?.compilationErrors || 0,
    runtimeErrors: progressDoc?.runtimeErrors || 0,
    codingSessions: progressDoc?.codingSessions || 0,
    codingTimeMinutes: progressDoc?.codingTimeMinutes || 0,
    lastActiveAt: progressDoc?.lastActiveAt || null,
    hasActivity:
      Boolean(progressDoc) &&
      [
        progressDoc.problemsAttempted,
        progressDoc.problemsSolved,
        progressDoc.submissions,
        progressDoc.acceptedSubmissions,
        progressDoc.compilationErrors,
        progressDoc.runtimeErrors,
        progressDoc.codingSessions,
        progressDoc.codingTimeMinutes,
      ].some((value) => Number(value || 0) > 0),
  };
}

async function recordExecution({
  studentId,
  classroomId,
  language,
  judge0LanguageId,
  judge0SubmissionToken,
  status,
  statusLabel,
  executionTime,
  memory,
  sourceCodeLength,
  stdinLength,
  problemKey = '',
}) {
  const normalizedLanguage = normalizeClassroomSubject(language);
  if (!normalizedLanguage) {
    return null;
  }

  const submission = await Submission.create({
    student: studentId,
    classroom: classroomId,
    language: normalizedLanguage,
    judge0LanguageId,
    judge0SubmissionToken: judge0SubmissionToken || '',
    status,
    statusLabel,
    executionTime: Number.isFinite(Number(executionTime)) ? Number(executionTime) : null,
    memory: Number.isFinite(Number(memory)) ? Number(memory) : null,
    sourceCodeLength: Number(sourceCodeLength) || 0,
    stdinLength: Number(stdinLength) || 0,
    problemKey,
  });

  const $inc = {
    submissions: 1,
  };

  if (isAcceptedStatus(status)) {
    $inc.acceptedSubmissions = 1;
  } else if (isCompilationError(status)) {
    $inc.compilationErrors = 1;
  } else if (isRuntimeError(status)) {
    $inc.runtimeErrors = 1;
  }

  if (problemKey) {
    $inc.problemsAttempted = 1;
    if (isAcceptedStatus(status)) {
      $inc.problemsSolved = 1;
    }
  }

  await StudentProgress.findOneAndUpdate(
    {
      student: studentId,
      language: normalizedLanguage,
    },
    {
      $inc,
      $set: {
        lastActiveAt: new Date(),
      },
      $setOnInsert: {
        student: studentId,
        language: normalizedLanguage,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return submission;
}

async function recordCodingSession({ studentId, language, durationMinutes }) {
  const normalizedLanguage = normalizeClassroomSubject(language);
  if (!normalizedLanguage) {
    return null;
  }

  const safeDuration = Math.max(0, Math.round(Number(durationMinutes) || 0));
  if (safeDuration === 0) {
    return null;
  }

  return StudentProgress.findOneAndUpdate(
    {
      student: studentId,
      language: normalizedLanguage,
    },
    {
      $inc: {
        codingSessions: 1,
        codingTimeMinutes: safeDuration,
      },
      $set: {
        lastActiveAt: new Date(),
      },
      $setOnInsert: {
        student: studentId,
        language: normalizedLanguage,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
}

async function getStudentProgress(studentId, language) {
  const normalizedLanguage = normalizeClassroomSubject(language);
  if (!normalizedLanguage) {
    return null;
  }

  const progress = await StudentProgress.findOne({ student: studentId, language: normalizedLanguage }).lean();
  return toLanguageRecord(normalizedLanguage, progress);
}

async function getStudentProgressMap(studentId, languages) {
  const records = await StudentProgress.find({ student: studentId, language: { $in: languages } }).lean();
  const byLanguage = new Map(records.map((record) => [record.language, record]));

  return languages.map((language) => toLanguageRecord(language, byLanguage.get(language)));
}

async function getRecentSubmissions(studentId, language = null, limit = 10) {
  const filter = { student: studentId };
  const normalizedLanguage = language ? normalizeClassroomSubject(language) : null;
  if (normalizedLanguage) {
    filter.language = normalizedLanguage;
  }

  return Submission.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  recordExecution,
  recordCodingSession,
  getStudentProgress,
  getStudentProgressMap,
  getRecentSubmissions,
  toLanguageRecord,
};
