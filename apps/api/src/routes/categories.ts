import { Router } from 'express';

import { prisma } from '../lib/prisma';

export const categoryRouter = Router();

categoryRouter.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: categories });
});
