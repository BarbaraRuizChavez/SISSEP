import { Router }                  from 'express';
import * as DocumentController     from '../controllers/document.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { upload }                  from '../middlewares/upload.middleware';

const router = Router();

// Rutas del estudiante
router.get( '/',                   authenticate, authorize('estudiante'), DocumentController.listMyDocs);
router.post('/upload',             authenticate, authorize('estudiante'), upload.single('file'), DocumentController.uploadFile);
router.post('/url',                authenticate, authorize('estudiante'), DocumentController.submitUrl);

// Rutas del encargado
router.get( '/progress',           authenticate, authorize('encargado'), DocumentController.progress);
router.get( '/student/:studentId', authenticate, authorize('encargado'), DocumentController.studentDocs);
router.patch('/:docId/review',     authenticate, authorize('encargado'), DocumentController.reviewDoc);

export default router;
