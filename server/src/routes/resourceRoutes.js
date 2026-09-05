import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const resources = ['contacts', 'products', 'accounts', 'journals', 'analytic-accounts', 'budgets', 'sales', 'purchases', 'payments', 'journal-entries', 'reports'];
export const resourceRoutes = Router();
resources.forEach(resource => resourceRoutes.use(`/${resource}`, authenticate, Router().get('/', (_request, response) => response.json({ success: true, data: [], message: `${resource} module placeholder` }))));
