import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import kitRoutes from './routes/kit.routes';
import practiceRoutes from './routes/practice.routes';

const app = express();

// --- Security & Parsing Middleware ---
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// --- Health Check ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/kits', kitRoutes);
app.use('/api/practice', practiceRoutes);

// --- Error Handler (must be last) ---
app.use(errorHandler);

// --- Database Connection & Server Start ---
async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    app.listen(config.port, () => {
      console.log(`🚀 API server running on port ${config.port}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Only start if not being imported (for testing)
if (require.main === module) {
  start();
}

export { app, start };
