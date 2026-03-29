import { Router } from 'express';

import {
  listProviders,
  listProvidersNearby,
  getProvider,
  createProvider,
  updateProvider,
  addServicePhotos,
  deleteServicePhoto,
  updateService,
} from '../controllers/providerController';
import { authenticate, requireRole } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

export const providerRouter = Router();

// Routes publiques
providerRouter.get('/nearby', listProvidersNearby);
providerRouter.get('/', listProviders);
providerRouter.get('/:id', getProvider);

// Routes authentifiées
providerRouter.post('/', authenticate, upload.single('avatar'), createProvider);
providerRouter.put('/me', authenticate, requireRole('PROVIDER'), upload.single('avatar'), updateProvider);

// Gestion des photos par service
providerRouter.post('/me/services/:serviceId/photos', authenticate, requireRole('PROVIDER'), upload.array('photos', 10), addServicePhotos);
providerRouter.delete('/me/services/:serviceId/photos/:photoId', authenticate, requireRole('PROVIDER'), deleteServicePhoto);

// Mettre à jour un service
providerRouter.put('/me/services/:serviceId', authenticate, requireRole('PROVIDER'), updateService);
