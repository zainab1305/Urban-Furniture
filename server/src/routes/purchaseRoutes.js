import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { createPurchaseOrder, createVendorBill, listPurchaseOrders, listVendorBills, registerVendorPayment } from '../controllers/purchaseController.js';

export const purchaseRoutes = Router();

purchaseRoutes.use(authenticate, authorize('ADMIN', 'ACCOUNTANT'));
purchaseRoutes.get('/orders', listPurchaseOrders);
purchaseRoutes.post('/orders', createPurchaseOrder);
purchaseRoutes.get('/bills', listVendorBills);
purchaseRoutes.post('/orders/:id/bill', createVendorBill);
purchaseRoutes.post('/bills/:id/payment', registerVendorPayment);
