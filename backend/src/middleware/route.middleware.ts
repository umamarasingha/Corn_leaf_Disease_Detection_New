import { Request, Response, NextFunction } from 'express';

export function validateUUID(req: Request, res: Response, next: NextFunction) {
  const { postId } = req.params;
  
  // Check if postId is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(postId)) {
    return res.status(404).json({ error: 'Route not found' });
  }
  
  next();
}
