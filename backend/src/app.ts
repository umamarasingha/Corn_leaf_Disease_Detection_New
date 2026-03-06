// Catch fatal errors so Railway logs show what crashed
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

console.log('[boot] process starting, NODE_ENV=' + process.env.NODE_ENV + ', PORT=' + process.env.PORT);

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middleware/error.middleware';
import { apiRateLimiter } from './middleware/rateLimit.middleware';

dotenv.config();
console.log('[boot] core imports loaded');

const app: Application = express();
const PORT = process.env.PORT || 8000;

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim());

const allowedOrigins = [
  ...corsOrigins,
  'https://localhost',
  'capacitor://localhost',
  'http://localhost',
];

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
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
app.use(apiRateLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Corn Leaf Disease Detector API',
    documentation: '/api-docs',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// ── Start server FIRST, then load routes ────────────────────────────────────
async function startServer() {
  console.log('[boot] starting server on port', PORT);

  app.listen(PORT, () => {
    console.log(`[boot] Server is running on port ${PORT}`);
  });

  // Load routes dynamically so a module-level crash doesn't kill the server
  try {
    console.log('[boot] loading routes...');
    const authRoutes = require('./routes/auth.routes').default;
    const detectionRoutes = require('./routes/detection.routes').default;
    const communityRoutes = require('./routes/community.routes').default;
    const adminRoutes = require('./routes/admin.routes').default;
    const chatRoutes = require('./routes/chat.routes').default;
    const newsRoutes = require('./routes/news.routes').default;
    const { updateProfile, changePassword } = require('./controllers/auth.controller');
    const { authenticateToken } = require('./middleware/auth.middleware');
    const { changePasswordValidation } = require('./utils/validators');
    const { validateRequest } = require('./middleware/validation.middleware');
    const { uploadSingle } = require('./config/multer');

    app.use('/api/auth', authRoutes);
    app.use('/api/detection', detectionRoutes);
    app.use('/api/community', communityRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/news', newsRoutes);

    app.put('/api/user/profile', authenticateToken, uploadSingle, updateProfile);
    app.put('/api/user/change-password', authenticateToken, changePasswordValidation, validateRequest, changePassword);
    app.delete('/api/user/account', authenticateToken, async (req: any, res: any) => {
      try {
        const userId = req.user!.userId;
        const prisma = (await import('./config/database')).default;
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

    // These must be LAST
    app.use(notFound);
    app.use(errorHandler);

    console.log('[boot] all routes loaded successfully');
  } catch (err) {
    console.error('[boot] ROUTE LOADING FAILED:', err);
    // Still keep server alive for health checks — add fallback 500 handler
    app.use((req: any, res: any) => {
      res.status(500).json({ error: 'Server failed to load routes', detail: String(err) });
    });
  }

  // Sync DB schema in background
  try {
    const { exec } = require('child_process');
    console.log('[boot] Running prisma db push...');
    exec('npx prisma db push --skip-generate --accept-data-loss', { timeout: 30000 }, (err: any, stdout: string, stderr: string) => {
      if (err) console.warn('[boot] prisma db push failed (non-fatal):', stderr || err.message);
      else console.log('[boot] DB schema synced:', stdout);
    });
  } catch (e) {
    console.warn('[boot] prisma db push skipped:', e);
  }

  // Load AI model in background
  try {
    const { aiService } = require('./services/ai.service');
    aiService.loadModel()
      .then(() => console.log('[boot] AI Service initialized'))
      .catch(() => console.warn('[boot] AI Service init failed, using fallback'));
  } catch (e) {
    console.warn('[boot] AI service load skipped:', e);
  }
}

startServer().catch(console.error);

export default app;
