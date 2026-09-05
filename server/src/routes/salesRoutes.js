import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { confirmSalesInvoice, confirmSalesOrder, createSalesInvoice, createSalesOrder, listSalesInvoices, listSalesOrders, registerCustomerPayment } from '../controllers/salesController.js';

export const salesRoutes = Router();
salesRoutes.use(authenticate, authorize('ADMIN', 'ACCOUNTANT'));
salesRoutes.get('/orders', listSalesOrders);
salesRoutes.post('/orders', createSalesOrder);
salesRoutes.post('/orders/:id/confirm', confirmSalesOrder);
salesRoutes.post('/orders/:id/invoice', createSalesInvoice);
salesRoutes.get('/invoices', listSalesInvoices);
salesRoutes.post('/invoices/:id/confirm', confirmSalesInvoice);
salesRoutes.post('/invoices/:id/payment', registerCustomerPayment);