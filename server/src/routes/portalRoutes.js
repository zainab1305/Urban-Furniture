import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { bill, dashboard, invoice, pay, payments } from '../controllers/portalController.js';

export const portalRoutes = Router();
portalRoutes.use(authenticate, authorize('CONTACT'));
portalRoutes.get('/dashboard', dashboard);
portalRoutes.get('/invoices/:id', invoice);
portalRoutes.get('/bills/:id', bill);
portalRoutes.get('/payments', payments);
portalRoutes.post('/payments', pay);
