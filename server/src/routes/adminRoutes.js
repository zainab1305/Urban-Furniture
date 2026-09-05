import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { archiveUser, createUser, dashboard, updateUser, users } from '../controllers/adminController.js';

export const adminRoutes = Router();
adminRoutes.use(authenticate, authorize('ADMIN'));
adminRoutes.get('/dashboard', dashboard);
adminRoutes.get('/users', users);
adminRoutes.post('/users', createUser);
adminRoutes.patch('/users/:id', updateUser);
adminRoutes.delete('/users/:id', archiveUser);
