import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  jwtSecret: process.env.JWT_SECRET || 'svs_furniture_production_security_token_2026',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  nodeEnv: process.env.NODE_ENV || 'development'
};
