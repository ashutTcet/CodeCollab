const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 12;

const executionWindows = new Map();

function executeRateLimit(req, res, next) {
  const now = Date.now();
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  const state = executionWindows.get(userId) || {
    count: 0,
    windowStart: now,
  };

  if (now - state.windowStart > WINDOW_MS) {
    state.count = 0;
    state.windowStart = now;
  }

  state.count += 1;
  executionWindows.set(userId, state);

  if (state.count > MAX_REQUESTS) {
    return res.status(429).json({
      message: 'Too many execution requests. Please wait a few seconds and try again.',
    });
  }

  return next();
}

module.exports = executeRateLimit;
