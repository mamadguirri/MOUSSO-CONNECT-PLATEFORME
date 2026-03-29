import { Router } from 'express';
import { authenticate, optionalAuth, requireRole } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

import {
  listFormations,
  getFormation,
  createFormation,
  updateFormation,
  uploadCover,
  deleteFormation,
  myFormations,
  addModule,
  updateModule,
  deleteModule,
  addMedia,
  deleteMedia,
  purchaseFormation,
  myPurchasedFormations,
} from '../controllers/formationController';

export const formationRouter = Router();

// Routes publiques / semi-publiques
formationRouter.get('/', listFormations);
formationRouter.get('/my', authenticate, requireRole('PROVIDER'), myFormations);
formationRouter.get('/purchased', authenticate, myPurchasedFormations);
formationRouter.get('/:id', optionalAuth, getFormation);

// CRUD Formation (Provider)
formationRouter.post('/', authenticate, requireRole('PROVIDER'), createFormation);
formationRouter.put('/:id', authenticate, requireRole('PROVIDER'), updateFormation);
formationRouter.put('/:id/cover', authenticate, requireRole('PROVIDER'), upload.single('cover'), uploadCover);
formationRouter.delete('/:id', authenticate, requireRole('PROVIDER'), deleteFormation);

// Modules
formationRouter.post('/:id/modules', authenticate, requireRole('PROVIDER'), addModule);
formationRouter.put('/modules/:moduleId', authenticate, requireRole('PROVIDER'), updateModule);
formationRouter.delete('/modules/:moduleId', authenticate, requireRole('PROVIDER'), deleteModule);

// Medias
formationRouter.post('/modules/:moduleId/medias', authenticate, requireRole('PROVIDER'), upload.single('file'), addMedia);
formationRouter.delete('/medias/:mediaId', authenticate, requireRole('PROVIDER'), deleteMedia);

// Achat
formationRouter.post('/:id/purchase', authenticate, purchaseFormation);
