import { Response } from 'express';
import { chatService } from '../services/chat.service';
import { AuthRequest } from '../middleware/auth.middleware';

export async function sendMessage(req: AuthRequest, res: Response) {
  try {
    const { message } = req.body;

    const response = await chatService.processMessage(message);

    res.json(response);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
}
