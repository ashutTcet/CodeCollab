const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');
const { initializeSocketServer } = require('./socket/socketServer');
const collaborationService = require('./services/collaborationService');

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 8080;

connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────

const CLIENT_ORIGIN = process.env.CLIENT_URL || 'http://localhost:5174';

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
const healthRouter = require('./routes/health');
app.use('/api/health', healthRouter);

const authRouter = require('./routes/auth');
const studentRouter = require('./routes/student');
const teacherRouter = require('./routes/teacher');
const classroomRouter = require('./routes/classrooms');
const codeRouter = require('./routes/code');
const aiRouter = require('./routes/ai');

app.use('/api/auth', authRouter);
app.use('/api/student', studentRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/classrooms', classroomRouter);
app.use('/api/code', codeRouter);
app.use('/api/ai', aiRouter);

// Future route stubs (not yet implemented)
// app.use('/api/sessions',  require('./routes/sessions'));
// app.use('/api/execute',   require('./routes/execute'));
// app.use('/api/progress',  require('./routes/progress'));

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);

  if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
    return res.status(409).json({
      success: false,
      message: 'Email is already registered',
    });
  }

  const statusCode = err.status || 500;
  const safeMessage = statusCode >= 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    message: safeMessage || 'Internal server error',
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────

initializeSocketServer(httpServer);

httpServer.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(`\n[StartupError] Port ${PORT} is already in use.`);
    console.error('Stop the existing process on this port, or set a different PORT in your environment.\n');
    process.exit(1);
  }

  console.error('\n[StartupError] Failed to start HTTP server.');
  console.error(error);
  process.exit(1);
});

httpServer.listen(PORT, () => {
  console.log(`\n🚀 CodeCollab API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS origin : ${CLIENT_ORIGIN}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

process.on('SIGINT', async () => {
  await collaborationService.flushAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await collaborationService.flushAll();
  process.exit(0);
});

module.exports = app;
