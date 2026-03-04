import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  validateToken,
  getMe,
  changePassword,
  updateProfile,
} from '../controllers/auth.controller';
import { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, changePasswordValidation } from '../utils/validators';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/forgot-password', forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validateRequest, resetPassword);
router.get('/validate-token', authenticateToken, validateToken);
router.get('/me', authenticateToken, getMe);
router.put('/change-password', authenticateToken, changePasswordValidation, validateRequest, changePassword);
router.put('/profile', authenticateToken, updateProfile);

// Additional routes to match frontend API calls
router.put('/user/change-password', authenticateToken, changePasswordValidation, validateRequest, changePassword);
router.put('/user/profile', authenticateToken, updateProfile);

export default router;
