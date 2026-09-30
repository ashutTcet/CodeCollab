const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

app.use('/api/auth', authRouter);
app.use('/api/student', studentRouter);
app.use('/api/teacher', teacherRouter);

// Future route stubs (not yet implemented)
// app.use('/api/sessions',  require('./routes/sessions'));
// app.use('/api/execute',   require('./routes/execute'));
// app.use('/api/ai',        require('./routes/ai'));
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

app.listen(PORT, () => {
  console.log(`\n🚀 CodeCollab API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
