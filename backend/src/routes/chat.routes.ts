import { Router } from 'express';
import { sendMessage } from '../controllers/chat.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, sendMessage);

export default router;
