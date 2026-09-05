import { Router } from 'express';
import {
  checkLoginId,
  login,
  logout,
  register,
  session
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

export const authRoutes = Router();

authRoutes.post('/signup', register);
authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
authRoutes.get('/session', authenticate, session);
authRoutes.get('/me', authenticate, session);
authRoutes.get('/check-login-id', checkLoginId);
