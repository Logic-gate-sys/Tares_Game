import { Router } from 'express';
import { authorize } from '#middlewares/authorize';
import { validateRequestBody } from '#middlewares/validate';
import { getUserDetails, updateUserProfile, leaderboard } from '#controllers/users';
import {UserUpdateSchema } from '#schemas/auth'

const router = Router();
router.get('/leaderboard', leaderboard);
router.get('/:id/profile', authorize, getUserDetails);
router.patch('/profile', authorize, validateRequestBody(UserUpdateSchema), updateUserProfile);

export default router;
