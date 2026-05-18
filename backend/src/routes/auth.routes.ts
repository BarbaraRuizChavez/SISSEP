import { Router }                  from 'express';
import multer                      from 'multer';
import * as AuthController         from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router      = Router();
const importUpload = multer({ storage: multer.memoryStorage() });

router.post('/register',         AuthController.register);
router.post('/login',            AuthController.login);
router.get( '/me',               authenticate, AuthController.me);
router.get( '/students',         authenticate, authorize('encargado'), AuthController.listStudents);
router.post('/students/import',  authenticate, authorize('encargado'), importUpload.single('file'), AuthController.importStudents);

export default router;
