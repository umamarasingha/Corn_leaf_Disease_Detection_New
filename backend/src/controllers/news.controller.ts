import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getNews(req: AuthRequest, res: Response) {
  try {
    const news = await prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(news);
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ error: 'Failed to get news' });
  }
}

export async function getNewsItem(req: AuthRequest, res: Response) {
  try {
    const { newsId } = req.params;

    const news = await prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json(news);
  } catch (error) {
    console.error('Get news item error:', error);
    res.status(500).json({ error: 'Failed to get news item' });
  }
}

export async function createNews(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, content } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const news = await prisma.news.create({
      data: {
        title,
        content,
        image,
      },
    });

    res.status(201).json(news);
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({ error: 'Failed to create news' });
  }
}

export async function updateNews(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { newsId } = req.params;
    const { title, content } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    const news = await prisma.news.update({
      where: { id: newsId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(image !== undefined && { image }),
      },
    });

    res.json(news);
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({ error: 'Failed to update news' });
  }
}

export async function deleteNews(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { newsId } = req.params;

    await prisma.news.delete({
      where: { id: newsId },
    });

    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ error: 'Failed to delete news' });
  }
}
