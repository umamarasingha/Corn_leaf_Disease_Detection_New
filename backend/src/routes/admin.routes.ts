import { Router } from 'express';
import {
  getStats,
  getUsers,
  getUser,
  updateUserRole,
  getUserRoleHistory,
  deleteUser,
  exportData,
  startModelTraining,
  getTrainingStatus,
} from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', authenticateToken, requireAdmin, getStats);
router.get('/users', authenticateToken, requireAdmin, getUsers);
router.get('/users/:userId', authenticateToken, requireAdmin, getUser);
router.put('/users/:userId/role', authenticateToken, requireAdmin, updateUserRole);
router.get('/users/:userId/role-history', authenticateToken, requireAdmin, getUserRoleHistory);
router.delete('/users/:userId', authenticateToken, requireAdmin, deleteUser);
router.get('/export/:dataType', authenticateToken, requireAdmin, exportData);
router.post('/train-model', authenticateToken, requireAdmin, startModelTraining);
router.get('/training/status/:jobId', authenticateToken, requireAdmin, getTrainingStatus);

export default router;
