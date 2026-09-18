import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Generate a JWT token and set it as an httpOnly cookie.
 */
function setTokenCookie(res: Response, userId: string): string {
  const token = jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  return token;
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = registerSchema.parse(req.body);

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      throw createError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }

    // Create user (password hashing handled by pre-save hook)
    const user = new User({ email, passwordHash: password });
    await user.save();

    // Generate token
    const token = setTokenCookie(res, user._id.toString());

    res.status(201).json({
      user: { id: user._id, email: user.email },
      token, // Also return token for clients that don't use cookies
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) {
      throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = setTokenCookie(res, user._id.toString());

    res.json({
      user: { id: user._id, email: user.email },
      token,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw createError('User not found', 404, 'USER_NOT_FOUND');
    }
    res.json({ user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

export default router;
