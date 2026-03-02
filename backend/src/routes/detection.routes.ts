import { Router } from 'express';
import {
  analyzeImage,
  getDetectionHistory,
  getDetectionDetails,
  deleteDetection,
} from '../controllers/detection.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadSingle } from '../config/multer';

const router = Router();

router.post('/analyze', authenticateToken, uploadSingle, analyzeImage);
router.get('/history/:userId', authenticateToken, getDetectionHistory);
router.get('/:detectionId', authenticateToken, getDetectionDetails);
router.delete('/:detectionId', authenticateToken, deleteDetection);

export default router;
