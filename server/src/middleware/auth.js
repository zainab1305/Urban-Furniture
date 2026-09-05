import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authenticate(request, response, next) {
  const authHeader = request.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const cookieToken = request.cookies?.token;
  const token = bearerToken || cookieToken;

  if (!token) {
    return response.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    request.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    return response.status(401).json({ success: false, message: 'Invalid token' });
  }
}

export function authorize(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
}
