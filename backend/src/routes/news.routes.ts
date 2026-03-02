import { Router } from 'express';
import {
  getNews,
  getNewsItem,
  createNews,
  updateNews,
  deleteNews,
} from '../controllers/news.controller';
import { newsValidation } from '../utils/validators';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { uploadSingle } from '../config/multer';

const router = Router();

router.get('/', getNews);
router.get('/:newsId', getNewsItem);
router.post('/', authenticateToken, requireAdmin, uploadSingle, newsValidation, validateRequest, createNews);
router.put('/:newsId', authenticateToken, requireAdmin, uploadSingle, newsValidation, validateRequest, updateNews);
router.delete('/:newsId', authenticateToken, requireAdmin, deleteNews);

export default router;
