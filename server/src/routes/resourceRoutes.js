import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { archiveContact, archiveProduct, createContact, createProduct, listContacts, listProducts, updateContact, updateProduct } from '../controllers/resourceController.js';

const resources = ['contacts', 'products', 'accounts', 'journals', 'analytic-accounts', 'budgets', 'sales', 'purchases', 'payments', 'journal-entries', 'reports'];
export const resourceRoutes = Router();
resourceRoutes.use(authenticate);
resourceRoutes.get('/contacts', listContacts);
resourceRoutes.post('/contacts', createContact);
resourceRoutes.patch('/contacts/:id', updateContact);
resourceRoutes.delete('/contacts/:id', archiveContact);
resourceRoutes.get('/products', listProducts);
resourceRoutes.post('/products', createProduct);
resourceRoutes.patch('/products/:id', updateProduct);
resourceRoutes.delete('/products/:id', archiveProduct);
resources.filter(resource => !['contacts', 'products'].includes(resource)).forEach(resource => resourceRoutes.get(`/${resource}`, (_request, response) => response.json({ success: true, data: [], message: `${resource} module placeholder` })));
