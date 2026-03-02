import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getPosts(req: AuthRequest, res: Response) {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        likes: true,
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const postsWithLikeStatus = posts.map(post => ({
      id: post.id,
      userId: post.userId,
      userName: post.user.name,
      userAvatar: post.user.avatar || '',
      title: post.title,
      content: post.content,
      images: JSON.parse(post.images || '[]'),
      likes: post._count.likes,
      comments: post.comments.map(comment => ({
        id: comment.id,
        userId: comment.userId,
        userName: comment.user.name,
        userAvatar: comment.user.avatar || '',
        content: comment.content,
        createdAt: comment.createdAt,
      })),
      createdAt: post.createdAt,
      isLiked: req.user?.userId ? post.likes.some(like => like.userId === req.user.userId) : false,
    }));

    res.json(postsWithLikeStatus);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
}

export async function createPost(req: AuthRequest, res: Response) {
  try {
    const { title, content } = req.body;
    const files = req.files as Express.Multer.File[];
    const images = files ? files.map(file => `/uploads/${file.filename}`) : [];
    const userId = req.user!.userId;

    const post = await prisma.post.create({
      data: {
        userId,
        title,
        content,
        images: JSON.stringify(images),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({
      ...post,
      images: JSON.parse(post.images),
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
}

export async function getPost(req: AuthRequest, res: Response) {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        likes: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postWithLikeStatus = {
      id: post.id,
      userId: post.userId,
      userName: post.user.name,
      userAvatar: post.user.avatar || '',
      title: post.title,
      content: post.content,
      images: JSON.parse(post.images || '[]'),
      likes: post.likes.length,
      comments: post.comments.map(comment => ({
        id: comment.id,
        userId: comment.userId,
        userName: comment.user.name,
        userAvatar: comment.user.avatar || '',
        content: comment.content,
        createdAt: comment.createdAt,
      })),
      createdAt: post.createdAt,
      isLiked: post.likes.some(like => like.userId === req.user!.userId),
    };

    res.json(postWithLikeStatus);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
}

export async function likePost(req: AuthRequest, res: Response) {
  try {
    const { postId } = req.params;
    const userId = req.user!.userId;

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });
      res.json({ liked: false });
    } else {
      await prisma.like.create({
        data: {
          postId,
          userId,
        },
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });
      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
}

export async function addComment(req: AuthRequest, res: Response) {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user!.userId;

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

export async function deletePost(req: AuthRequest, res: Response) {
  try {
    const { postId } = req.params;
    const userId = req.user!.userId;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
}
