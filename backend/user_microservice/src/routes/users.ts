import { Router } from 'express';
import { authorize } from '#middlewares/authorize';
import {getUserDetails, userStats, statsById, updateUserProfile, leaderboard } from '#controllers/users';

const router = Router();
router.get('/leaderboard', leaderboard);
router.get('/me/:id', authorize, getUserDetails);
router.patch('/me', authorize, updateUserProfile);
router.get('/me/stats', authorize, userStats);
router.get('/:id/stats', statsById);

export default router;
