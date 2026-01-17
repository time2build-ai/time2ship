import { Router } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { validate } from '@/middleware/validate';
import { authenticate } from '@/features/auth/middleware/authenticate';
import { userController } from '../controllers/user.controller';
import { getUserSchema, updateUserSchema, listUsersSchema } from '../validators/user.validators';

const router = Router();

router.use(authenticate);

router.get('/', validate(listUsersSchema), asyncHandler(userController.list.bind(userController)));
router.get('/:id', validate(getUserSchema), asyncHandler(userController.getById.bind(userController)));
router.put('/:id', validate(updateUserSchema), asyncHandler(userController.update.bind(userController)));
router.delete('/:id', validate(getUserSchema), asyncHandler(userController.delete.bind(userController)));

export default router;
