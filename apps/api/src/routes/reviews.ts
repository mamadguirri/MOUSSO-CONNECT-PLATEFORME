import { Router } from 'express';

import { createReview, getProviderReviews } from '../controllers/reviewController';
import { authenticate } from '../middlewares/auth';

export const reviewRouter = Router();

// Route publique - voir les avis
reviewRouter.get('/:providerId', getProviderReviews);

// Route authentifiée - laisser un avis
reviewRouter.post('/', authenticate, createReview);
