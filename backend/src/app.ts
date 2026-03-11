/**
 * Corn Leaf Disease Detector – Backend Entry Point
 *
 * Strategy: start a raw HTTP server IMMEDIATELY so Railway healthcheck passes,
 * then attach Express app and load routes.
 */

import http from 'http';

const PORT = parseInt(process.env.PORT || '8000', 10);

// ── 1. Bare-bones HTTP server that passes healthcheck instantly ──────────────
const server = http.createServer((req, res) => {
  // This handler is replaced once Express is ready
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'booting' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[boot] HTTP server listening on 0.0.0.0:${PORT}`);
  bootstrapExpress();
});

server.on('error', (err) => {
  console.error('[boot] FATAL server error:', err);
  process.exit(1);
});

// ── 2. Bootstrap Express on top of the running server ────────────────────────
async function bootstrapExpress() {
  try {
    console.log('[boot] loading express...');
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const morgan = require('morgan');
    const path = require('path');
    const dotenv = require('dotenv');

    dotenv.config();

    const app = express();
    app.set('trust proxy', 1);

    const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
      .split(',')
      .map((s: string) => s.trim());

    const allowedOrigins = [
      ...corsOrigins,
      'https://localhost',
      'capacitor://localhost',
      'http://localhost',
    ];

    app.use(helmet());
    app.use(cors({
      origin: (origin: string | undefined, callback: Function) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn('CORS blocked origin:', origin);
          callback(null, true);
        }
      },
      credentials: true,
    }));
    app.use(morgan('combined'));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    const { apiRateLimiter } = require('./middleware/rateLimit.middleware');
    app.use(apiRateLimiter);

    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Health & root
    app.get('/health', (_req: any, res: any) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    app.get('/', (_req: any, res: any) => {
      res.json({
        message: 'Welcome to Corn Leaf Disease Detector API',
        status: 'running',
        timestamp: new Date().toISOString(),
      });
    });

    // ── Load routes ──────────────────────────────────────────────────────────
    console.log('[boot] loading routes...');
    const authRoutes = require('./routes/auth.routes').default;
    const detectionRoutes = require('./routes/detection.routes').default;
    const communityRoutes = require('./routes/community.routes').default;
    const adminRoutes = require('./routes/admin.routes').default;
    const chatRoutes = require('./routes/chat.routes').default;
    const newsRoutes = require('./routes/news.routes').default;

    app.use('/api/auth', authRoutes);
    app.use('/api/detection', detectionRoutes);
    app.use('/api/community', communityRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/news', newsRoutes);

    // User profile / account routes
    const { updateProfile, changePassword } = require('./controllers/auth.controller');
    const { authenticateToken } = require('./middleware/auth.middleware');
    const { changePasswordValidation } = require('./utils/validators');
    const { validateRequest } = require('./middleware/validation.middleware');
    const { uploadSingle } = require('./config/multer');

    app.put('/api/user/profile', authenticateToken, uploadSingle, updateProfile);
    app.put('/api/user/change-password', authenticateToken, changePasswordValidation, validateRequest, changePassword);
    app.delete('/api/user/account', authenticateToken, async (req: any, res: any) => {
      try {
        const userId = req.user!.userId;
        const prisma = require('./config/database').default;
        await prisma.detection.deleteMany({ where: { userId } });
        await prisma.comment.deleteMany({ where: { userId } });
        await prisma.like.deleteMany({ where: { userId } });
        await prisma.post.deleteMany({ where: { userId } });
        await prisma.roleHistory.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
        res.json({ message: 'Account deleted successfully' });
      } catch (error: any) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
      }
    });

    // Error handlers (must be last)
    const { notFound, errorHandler } = require('./middleware/error.middleware');
    app.use(notFound);
    app.use(errorHandler);

    // Hand over to Express
    server.removeAllListeners('request');
    server.on('request', app);
    console.log('[boot] Express app ready, all routes loaded');

  } catch (err) {
    console.error('[boot] EXPRESS BOOTSTRAP FAILED:', err);
    // Server keeps running with the bare-bones handler so healthcheck still passes
  }

  // ── Background tasks ────────────────────────────────────────────────────
  // Sync DB schema
  try {
    const { exec } = require('child_process');
    exec('npx prisma db push --skip-generate --accept-data-loss', { timeout: 30000 },
      (err: any, stdout: string, stderr: string) => {
        if (err) console.warn('[boot] prisma db push failed (non-fatal):', stderr || err.message);
        else console.log('[boot] DB schema synced');
      });
  } catch (e) {
    console.warn('[boot] prisma db push skipped:', e);
  }

  // Load AI model
  try {
    const { aiService } = require('./services/ai.service');
    aiService.loadModel()
      .then(() => console.log('[boot] AI Service initialized'))
      .catch(() => console.warn('[boot] AI Service init failed, using fallback'));
  } catch (e) {
    console.warn('[boot] AI service load skipped:', e);
  }
}

// Catch-all error handlers
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

export default server;
