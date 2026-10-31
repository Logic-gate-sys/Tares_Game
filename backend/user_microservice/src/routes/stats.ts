import { Router } from 'express';
import {getChampions, getLeaderboard } from '#controllers/stats';

const router = Router();
router.get('/global/champions', getChampions);
router.get('/leaderboard', getLeaderboard);

export default router;
