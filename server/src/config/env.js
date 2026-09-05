import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret',
  databaseUrl: process.env.DATABASE_URL
};
