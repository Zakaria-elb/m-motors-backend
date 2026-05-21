import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || '3001',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || '',
  AWS_REGION: process.env.AWS_REGION || 'eu-west-3',
};
