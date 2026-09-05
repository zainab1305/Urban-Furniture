import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { resourceRoutes } from './routes/resourceRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { portalRoutes } from './routes/portalRoutes.js';
import { purchaseRoutes } from './routes/purchaseRoutes.js';

export const app = express();
const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
app.use(cors({ origin: env.clientUrls, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(serverDirectory, 'uploads')));

app.get('/api/health', (_request, response) =>
  response.json({ success: true, message: 'Urban Furniture API is running' })
);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api', resourceRoutes);
app.use(errorHandler);
