import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth';
import { providerRouter } from './routes/providers';
import { categoryRouter } from './routes/categories';
import { quartierRouter } from './routes/quartiers';
import { userRouter } from './routes/users';
import { adminRouter } from './routes/admin';
import { bookingRouter } from './routes/bookings';
import { messageRouter } from './routes/messages';
import { reviewRouter } from './routes/reviews';
import { formationRouter } from './routes/formations';
import { notificationRouter } from './routes/notifications';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 4000;

// Sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Rate limiting global
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Trop de requêtes, réessayez plus tard.' } },
}));

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/providers', providerRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/quartiers', quartierRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/formations', formationRouter);
app.use('/api/v1/notifications', notificationRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API Musso Connect démarrée sur le port ${PORT}`);
});

export default app;
