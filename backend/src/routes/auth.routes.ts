import { Router }                  from 'express';
import * as AuthController         from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login',    AuthController.login);
router.get( '/me',       authenticate, AuthController.me);
router.get( '/students', authenticate, authorize('encargado'), AuthController.listStudents);

export default router;
