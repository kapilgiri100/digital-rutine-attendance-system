if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '../.env' });
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teachers');
const studentRoutes = require('./routes/students');
const subjectRoutes = require('./routes/subjects');
const scheduleRoutes = require('./routes/schedule');
const attendanceRoutes = require('./routes/attendance');
const academicRoutes = require('./routes/academic');

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : ['http://localhost:5173'];

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// DB
const { shutdown } = require('./db');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', authenticateToken, teacherRoutes);
app.use('/api/students', authenticateToken, studentRoutes);
app.use('/api/subjects', authenticateToken, subjectRoutes);
app.use('/api/schedule', authenticateToken, scheduleRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/academic-year', authenticateToken, academicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

let server;
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`
Received ${signal}. Shutting down backend gracefully...`);

  if (server) {
    server.close((closeErr) => {
      if (closeErr) {
        console.error('Server close error:', closeErr);
      }
    });
  }

  try {
    await shutdown();
  } catch (err) {
    console.error('Shutdown error:', err);
  }

  setTimeout(() => {
    console.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000).unref();

  process.exit(0);
};

server = app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = app;

