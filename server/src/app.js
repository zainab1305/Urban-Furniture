import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { resourceRoutes } from './routes/resourceRoutes.js';

export const app = express();
app.use(cors({ origin: env.clientUrls }));
app.use(express.json());
app.use(morgan('dev'));
app.get('/api/health', (_request, response) => response.json({ success: true, message: 'Urban Furniture API is running' }));
app.use('/api/auth', authRoutes);
app.use('/api', resourceRoutes);
app.use(errorHandler);
