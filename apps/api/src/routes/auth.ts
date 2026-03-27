import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { register, loginPassword, requestPasswordReset, resetPassword, refresh, logout } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Trop de tentatives, réessayez dans 1 minute.' } },
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Trop de tentatives OTP, réessayez dans 1 minute.' } },
});

authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, loginPassword);
authRouter.post('/request-reset', otpLimiter, requestPasswordReset);
authRouter.post('/reset-password', otpLimiter, resetPassword);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', authenticate, logout);
