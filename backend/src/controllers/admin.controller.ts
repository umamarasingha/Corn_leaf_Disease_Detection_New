import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { exportUsers, exportDetections, exportPosts } from '../services/export.service';

export async function getStats(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [totalUsers, totalDetections, totalPosts, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.detection.count(),
      prisma.post.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    res.json({
      totalUsers,
      totalDetections,
      totalPosts,
      activeUsers,
      modelAccuracy: 0.85,
      dataPoints: totalDetections,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
}

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
}

export async function getUser(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
}

export async function updateUserRole(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.roleHistory.create({
      data: {
        userId,
        oldRole: user.role,
        newRole: role,
        changedBy: req.user!.userId,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}

export async function getUserRoleHistory(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;

    const history = await prisma.roleHistory.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
    });

    res.json(history);
  } catch (error) {
    console.error('Get role history error:', error);
    res.status(500).json({ error: 'Failed to get role history' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

export async function exportData(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { dataType } = req.params;

    switch (dataType) {
      case 'users':
        await exportUsers(res);
        break;
      case 'detections':
        await exportDetections(res);
        break;
      case 'posts':
        await exportPosts(res);
        break;
      default:
        res.status(400).json({ error: 'Invalid data type' });
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
}

export async function startModelTraining(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { trainingData } = req.body;
    // Mock training job ID
    const jobId = `training-${Date.now()}`;
    
    res.json({ 
      message: 'Training job started',
      jobId,
      status: 'running'
    });
  } catch (error) {
    console.error('Start training error:', error);
    res.status(500).json({ error: 'Failed to start training' });
  }
}

export async function getTrainingStatus(req: AuthRequest, res: Response) {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { jobId } = req.params;
    
    // Mock training status
    res.json({
      jobId,
      status: 'completed',
      accuracy: 94.7,
      loss: 0.142,
      epoch: 50,
      totalEpochs: 50
    });
  } catch (error) {
    console.error('Get training status error:', error);
    res.status(500).json({ error: 'Failed to get training status' });
  }
}
