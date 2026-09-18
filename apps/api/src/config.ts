import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

export const config = {
  port: parseInt(process.env.API_PORT || '3001', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/jobprepassistant',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
