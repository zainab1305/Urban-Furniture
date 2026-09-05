import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 5000),
  clientUrls: (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret',
  databaseUrl: process.env.DATABASE_URL
};
