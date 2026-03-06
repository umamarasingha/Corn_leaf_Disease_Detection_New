console.log('[boot] process starting, NODE_ENV=' + process.env.NODE_ENV + ', PORT=' + process.env.PORT);

// Catch fatal errors so Railway logs show what crashed
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import { aiService } from './services/ai.service';
import { errorHandler, notFound } from './middleware/error.middleware';
import { apiRateLimiter } from './middleware/rateLimit.middleware';

dotenv.config();
console.log('[boot] imports loaded, configuring express');

const app: Application = express();
const PORT = process.env.PORT || 8000;

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim());

// Capacitor WebView uses https://localhost or capacitor://localhost
const allowedOrigins = [
  ...corsOrigins,
  'https://localhost',
  'capacitor://localhost',
  'http://localhost',
];

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
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

app.get('/health', async (req, res) => {
  const mlUrl = process.env.ML_SERVICE_URL || 'not set';
  let mlStatus = 'unknown';
  try {
    const { isPythonAvailable } = await import('./services/ai.service').then(m => ({
      isPythonAvailable: (m.aiService as any).isPythonServiceAvailable
    }));
    mlStatus = isPythonAvailable ? 'connected' : 'disconnected';
  } catch { mlStatus = 'error'; }
  res.json({ status: 'ok', ml_service_url: mlUrl, ml_status: mlStatus });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Corn Leaf Disease Detector API',
    documentation: '/api-docs',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

import authRoutes from './routes/auth.routes';
import detectionRoutes from './routes/detection.routes';
import communityRoutes from './routes/community.routes';
import adminRoutes from './routes/admin.routes';
import chatRoutes from './routes/chat.routes';
import newsRoutes from './routes/news.routes';
import { updateProfile, changePassword } from './controllers/auth.controller';
import { authenticateToken } from './middleware/auth.middleware';
import { changePasswordValidation } from './utils/validators';
import { validateRequest } from './middleware/validation.middleware';

app.use('/api/auth', authRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/news', newsRoutes);

// User routes to match frontend API calls
import { uploadSingle } from './config/multer';
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

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  console.log('[boot] starting server on port', PORT);
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Sync DB schema in background (creates tables if they don't exist)
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

  // Load AI model in background so the server is immediately available
  aiService.loadModel()
    .then(() => console.log('AI Service initialized'))
    .catch(() => console.warn('AI Service initialization failed, using fallback mode'));
}

startServer().catch(console.error);

export default app;
