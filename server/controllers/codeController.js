const collaborationService = require('../services/collaborationService');
const judge0Service = require('../services/judge0Service');
const progressService = require('../services/progressService');
const {
  getExecutionLanguage,
  listExecutionLanguages,
} = require('../config/executionLanguages');

const MAX_SOURCE_CODE_LENGTH = 120000;
const MAX_STDIN_LENGTH = 20000;

function getStatusKey(statusId, statusDescription) {
  if (statusId === 3) return 'accepted';
  if (statusId === 5) return 'time_limit_exceeded';
  if (statusId === 6) return 'compilation_error';
  if ([7, 8, 9, 10, 11, 12].includes(statusId)) return 'runtime_error';
  if (statusId === 13) return 'execution_failed';
  if (statusId === 14) return 'execution_failed';

  const normalized = String(statusDescription || '').toLowerCase();
  if (normalized.includes('time limit')) return 'time_limit_exceeded';
  if (normalized.includes('memory limit')) return 'memory_limit_exceeded';
  if (normalized.includes('compile')) return 'compilation_error';
  return 'execution_failed';
}

function toDisplayStatus(statusKey) {
  const labels = {
    accepted: 'Accepted',
    compilation_error: 'Compilation Error',
    runtime_error: 'Runtime Error',
    time_limit_exceeded: 'Time Limit Exceeded',
    memory_limit_exceeded: 'Memory Limit Exceeded',
    execution_failed: 'Execution Failed',
  };

  return labels[statusKey] || 'Execution Failed';
}

function normalizeExecutionResult(result, languageKey) {
  const statusId = result.status?.id;
  const statusDescription = result.status?.description || 'Execution Failed';
  const statusKey = getStatusKey(statusId, statusDescription);

  return {
    status: statusKey,
    statusLabel: toDisplayStatus(statusKey),
    statusId,
    statusDescription,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    compileOutput: result.compile_output || '',
    message: result.message || '',
    executionTime: result.time || null,
    memory: result.memory || null,
    language: languageKey,
    stdinUsed: Boolean(result.stdin),
  };
}

function validatePayload(payload) {
  const classroomId = String(payload.classroomId || '').trim();
  const sourceCode = String(payload.sourceCode || '');
  const stdin = String(payload.stdin || '');

  if (!classroomId) {
    return { error: 'Classroom ID is required.' };
  }

  if (!sourceCode.trim()) {
    return { error: 'Code cannot be empty.' };
  }

  if (sourceCode.length > MAX_SOURCE_CODE_LENGTH) {
    return { error: 'Code is too large to execute.' };
  }

  if (stdin.length > MAX_STDIN_LENGTH) {
    return { error: 'Input is too large.' };
  }

  return {
    classroomId,
    sourceCode,
    stdin,
  };
}

async function getSupportedExecutionLanguages(req, res, next) {
  try {
    return res.status(200).json({
      languages: listExecutionLanguages(),
    });
  } catch (error) {
    return next(error);
  }
}

async function executeCode(req, res, next) {
  try {
    const payload = validatePayload(req.body || {});

    if (payload.error) {
      return res.status(400).json({
        message: payload.error,
      });
    }

    const classroom = await collaborationService.authorizeClassroomAccess({
      classroomId: payload.classroomId,
      userId: req.user.id,
      role: req.user.role,
    });

    const selectedLanguage = getExecutionLanguage(classroom.subject);

    if (!selectedLanguage) {
      return res.status(500).json({
        message: 'Classroom language is not configured for execution.',
      });
    }

    const judge0Result = await judge0Service.runCode({
      languageId: selectedLanguage.judge0LanguageId,
      sourceCode: payload.sourceCode,
      stdin: payload.stdin,
    });

    const normalized = normalizeExecutionResult(judge0Result, selectedLanguage.key);

    await progressService.recordExecution({
      studentId: req.user.id,
      classroomId: payload.classroomId,
      language: classroom.subject,
      judge0LanguageId: selectedLanguage.judge0LanguageId,
      judge0SubmissionToken: judge0Result.token || '',
      status: normalized.status,
      statusLabel: normalized.statusLabel,
      executionTime: normalized.executionTime,
      memory: normalized.memory,
      sourceCodeLength: payload.sourceCode.length,
      stdinLength: payload.stdin.length,
    });

    return res.status(200).json(normalized);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        message: error.status >= 500
          ? 'Code execution service is temporarily unavailable.'
          : error.message,
      });
    }

    return next(error);
  }
}

module.exports = {
  executeCode,
  getSupportedExecutionLanguages,
};
