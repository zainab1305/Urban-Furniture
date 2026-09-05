import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authenticate(request, response, next) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) return response.status(401).json({ success: false, message: 'Authentication required' });
  try { request.user = jwt.verify(token, env.jwtSecret); next(); } catch { response.status(401).json({ success: false, message: 'Invalid token' }); }
}

export function authorize(...roles) {
  return (request, response, next) => roles.includes(request.user?.role) ? next() : response.status(403).json({ success: false, message: 'Insufficient permissions' });
}
