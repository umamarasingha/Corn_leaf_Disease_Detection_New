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
console.log('Starting app, PORT=' + (process.env.PORT || '8000'));

const app: Application = express();
const PORT = process.env.PORT || 8000;

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(helmet());
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(apiRateLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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
import { updateProfile, changePassword } from './controllers/auth.controller';
import { authenticateToken } from './middleware/auth.middleware';
import { changePasswordValidation } from './utils/validators';
import { validateRequest } from './middleware/validation.middleware';

app.use('/api/auth', authRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// User routes to match frontend API calls
import { uploadSingle } from './config/multer';
app.put('/api/user/profile', authenticateToken, uploadSingle, updateProfile);
app.put('/api/user/change-password', authenticateToken, changePasswordValidation, validateRequest, changePassword);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
  });

  // Load AI model in background so the server is immediately available
  aiService.loadModel()
    .then(() => console.log('AI Service initialized'))
    .catch(() => console.warn('AI Service initialization failed, using fallback mode'));
}

startServer().catch(console.error);

export default app;
