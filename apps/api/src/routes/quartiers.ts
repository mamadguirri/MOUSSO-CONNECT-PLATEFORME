import { Router } from 'express';

import { prisma } from '../lib/prisma';

export const quartierRouter = Router();

quartierRouter.get('/', async (_req, res) => {
  const quartiers = await prisma.quartier.findMany({
    orderBy: [{ region: 'asc' }, { ville: 'asc' }, { name: 'asc' }],
  });
  res.json({ success: true, data: quartiers });
});
