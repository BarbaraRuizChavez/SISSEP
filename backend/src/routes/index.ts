import { Router }     from 'express';
import authRoutes     from './auth.routes';
import documentRoutes from './document.routes';
import periodRoutes   from './period.routes';

const router = Router();
router.use('/auth',      authRoutes);
router.use('/documents', documentRoutes);
router.use('/periods',   periodRoutes);

export default router;
