const aiService = require('../services/aiService');
const collaborationService = require('../services/collaborationService');

// ─── 1. Explain Error Validation & Handler ──────────────────────────────────

function validateExplainPayload(payload) {
  const code = String(payload.code || payload.sourceCode || '');
  const language = String(payload.language || '').trim().toLowerCase();
  const error = String(payload.error || payload.stderr || payload.compileOutput || payload.compile_output || '');
  const stdin = String(payload.stdin || '');
  const executionStatus = String(payload.executionStatus || payload.status || '');
  const classroomId = payload.classroomId ? String(payload.classroomId).trim() : null;

  if (!code.trim()) {
    return { validationError: 'Source code is required to explain the error.' };
  }

  if (code.length > aiService.MAX_CODE_LENGTH) {
    return { validationError: 'Source code is too large for AI explanation.' };
  }

  if (!language) {
    return { validationError: 'Programming language is required.' };
  }

  if (!error.trim()) {
    return { validationError: 'Error output is required to generate an explanation.' };
  }

  if (error.length > aiService.MAX_ERROR_LENGTH) {
    return { validationError: 'Error output is too large.' };
  }

  return {
    validationError: null,
    code,
    language,
    error,
    stdin,
    executionStatus,
    classroomId,
  };
}

async function explainError(req, res, next) {
  try {
    const payload = validateExplainPayload(req.body || {});

    if (payload.validationError) {
      return res.status(400).json({
        success: false,
        message: payload.validationError,
      });
    }

    if (payload.classroomId) {
      await collaborationService.authorizeClassroomAccess({
        classroomId: payload.classroomId,
        userId: req.user.id,
        role: req.user.role,
      });
    }

    const aiResult = await aiService.explainCodeError({
      language: payload.language,
      code: payload.code,
      error: payload.error,
      stdin: payload.stdin,
      executionStatus: payload.executionStatus,
    });

    return res.status(200).json({
      success: true,
      explanation: aiResult.explanation,
      cause: aiResult.cause,
      fix: aiResult.fix,
      learningTip: aiResult.learningTip,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
}

// ─── 2. AI Hint Validation & Handler ────────────────────────────────────────

function validateHintPayload(payload) {
  const code = String(payload.code || payload.sourceCode || '');
  const language = String(payload.language || '').trim().toLowerCase();
  const error = String(payload.error || payload.stderr || payload.compileOutput || payload.compile_output || '');
  const stdin = String(payload.stdin || '');
  const userQuestion = String(payload.userQuestion || payload.question || '');
  const classroomId = payload.classroomId ? String(payload.classroomId).trim() : null;

  if (!code.trim()) {
    return { validationError: 'Source code is required to generate a hint.' };
  }

  if (code.length > aiService.MAX_CODE_LENGTH) {
    return { validationError: 'Source code is too large for AI processing.' };
  }

  if (!language) {
    return { validationError: 'Programming language is required.' };
  }

  if (error.length > aiService.MAX_ERROR_LENGTH) {
    return { validationError: 'Error output is too large.' };
  }

  if (userQuestion.length > aiService.MAX_QUESTION_LENGTH) {
    return { validationError: 'Question text is too large.' };
  }

  return {
    validationError: null,
    code,
    language,
    error,
    stdin,
    userQuestion,
    classroomId,
  };
}

async function getHint(req, res, next) {
  try {
    const payload = validateHintPayload(req.body || {});

    if (payload.validationError) {
      return res.status(400).json({
        success: false,
        message: payload.validationError,
      });
    }

    if (payload.classroomId) {
      await collaborationService.authorizeClassroomAccess({
        classroomId: payload.classroomId,
        userId: req.user.id,
        role: req.user.role,
      });
    }

    const aiResult = await aiService.generateHint({
      language: payload.language,
      code: payload.code,
      error: payload.error,
      stdin: payload.stdin,
      userQuestion: payload.userQuestion,
    });

    return res.status(200).json({
      success: true,
      hint: aiResult.hint,
      concept: aiResult.concept,
      nextStep: aiResult.nextStep,
      learningTip: aiResult.learningTip,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
}

// ─── 3. AI Debugger Validation & Handler ────────────────────────────────────

function validateDebugPayload(payload) {
  const code = String(payload.code || payload.sourceCode || '');
  const language = String(payload.language || '').trim().toLowerCase();
  const error = String(payload.error || payload.stderr || payload.compileOutput || payload.compile_output || '');
  const output = String(payload.output || payload.stdout || '');
  const stdin = String(payload.stdin || '');
  const classroomId = payload.classroomId ? String(payload.classroomId).trim() : null;

  if (!code.trim()) {
    return { validationError: 'Source code is required to debug.' };
  }

  if (code.length > aiService.MAX_CODE_LENGTH) {
    return { validationError: 'Source code is too large for AI debugging.' };
  }

  if (!language) {
    return { validationError: 'Programming language is required.' };
  }

  if (error.length > aiService.MAX_ERROR_LENGTH) {
    return { validationError: 'Error output is too large.' };
  }

  if (output.length > aiService.MAX_OUTPUT_LENGTH) {
    return { validationError: 'Program output is too large.' };
  }

  return {
    validationError: null,
    code,
    language,
    error,
    output,
    stdin,
    classroomId,
  };
}

async function debugCode(req, res, next) {
  try {
    const payload = validateDebugPayload(req.body || {});

    if (payload.validationError) {
      return res.status(400).json({
        success: false,
        message: payload.validationError,
      });
    }

    if (payload.classroomId) {
      await collaborationService.authorizeClassroomAccess({
        classroomId: payload.classroomId,
        userId: req.user.id,
        role: req.user.role,
      });
    }

    const aiResult = await aiService.debugCode({
      language: payload.language,
      code: payload.code,
      error: payload.error,
      output: payload.output,
      stdin: payload.stdin,
    });

    return res.status(200).json({
      success: true,
      summary: aiResult.summary,
      bugs: aiResult.bugs,
      overallSuggestion: aiResult.overallSuggestion,
      learningTip: aiResult.learningTip,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
}

// ─── 4. AI Tutor Chat Validation & Handler ──────────────────────────────────

function validateChatPayload(payload) {
  const message = String(payload.message || '').trim();
  const code = String(payload.code || payload.sourceCode || '');
  const language = String(payload.language || '').trim().toLowerCase();
  const error = String(payload.error || payload.stderr || payload.compileOutput || payload.compile_output || '');
  const output = String(payload.output || payload.stdout || '');
  const stdin = String(payload.stdin || '');
  const conversation = Array.isArray(payload.conversation) ? payload.conversation : [];
  const classroomId = payload.classroomId ? String(payload.classroomId).trim() : null;

  if (!message) {
    return { validationError: 'Chat message cannot be empty.' };
  }

  if (message.length > aiService.MAX_MESSAGE_LENGTH) {
    return { validationError: 'Chat message is too long.' };
  }

  if (!code.trim()) {
    return { validationError: 'Active source code is required for context.' };
  }

  if (code.length > aiService.MAX_CODE_LENGTH) {
    return { validationError: 'Source code is too large for AI context.' };
  }

  if (!language) {
    return { validationError: 'Programming language is required.' };
  }

  if (error.length > aiService.MAX_ERROR_LENGTH) {
    return { validationError: 'Error log is too large.' };
  }

  if (output.length > aiService.MAX_OUTPUT_LENGTH) {
    return { validationError: 'Program output is too large.' };
  }

  return {
    validationError: null,
    message,
    code,
    language,
    error,
    output,
    stdin,
    conversation,
    classroomId,
  };
}

async function chat(req, res, next) {
  try {
    const payload = validateChatPayload(req.body || {});

    if (payload.validationError) {
      return res.status(400).json({
        success: false,
        message: payload.validationError,
      });
    }

    if (payload.classroomId) {
      await collaborationService.authorizeClassroomAccess({
        classroomId: payload.classroomId,
        userId: req.user.id,
        role: req.user.role,
      });
    }

    const reply = await aiService.generateTutorResponse({
      message: payload.message,
      language: payload.language,
      code: payload.code,
      error: payload.error,
      output: payload.output,
      stdin: payload.stdin,
      conversation: payload.conversation,
    });

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
}

module.exports = {
  explainError,
  getHint,
  debugCode,
  chat,
};
