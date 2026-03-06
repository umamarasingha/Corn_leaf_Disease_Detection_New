import { Router } from 'express';
import {
  getPosts,
  createPost,
  getPost,
  likePost,
  addComment,
  deletePost,
} from '../controllers/community.controller';
import { postValidation, commentValidation } from '../utils/validators';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';
import { uploadMultiple } from '../config/multer';

const router = Router();

// Routes
router.post('/', authenticateToken, uploadMultiple, postValidation, validateRequest, createPost);
router.get('/', optionalAuth, getPosts);
router.get('/:postId', optionalAuth, getPost);
router.post('/:postId/like', authenticateToken, likePost);
router.post('/:postId/comments', authenticateToken, commentValidation, validateRequest, addComment);
router.delete('/:postId', authenticateToken, deletePost);

export default router;
