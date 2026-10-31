// src/controllers/stats.controller.ts
import type { NextFunction, Request, Response } from 'express';
import { findChampions, findLeaderboard } from '#repositories/stats';
import { ALL_TIME_START, currentWeekStart } from '#utils/period';

type AuthedRequest = Request & { user?: { id: number } };

const PERIOD_MAP = {
  weekly: 'weekly',
  'all-time': 'all_time',
} as const;

function toPositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export async function getChampions(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(toPositiveInt(req.query.limit, 3), 10);
    const rows = await findChampions(limit);
    const champions = rows.map((r) => ({
      id: r.id,
      name: r.name,
      season: r.season,
      winRate: r.winRate ?? 0,
      words: r.words ?? 0,
      avatarUrl: r.avatarUrl ?? '',
      avatarAlt: `${r.name} avatar`,
    }));

    return res.status(200).json({
      message: champions.length ? 'Champions loaded' : 'No champions yet',
      champions: champions,
    })
  } catch (err) {
    next(err);
  }
}

// GET /users/leaderboard?period=weekly|all-time&page=1&limit=50
export async function getLeaderboard(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const periodParam = String(req.query.period ?? 'weekly') as keyof typeof PERIOD_MAP;
    const period = PERIOD_MAP[periodParam];

    if (!period) {
      return res.status(400).json({ message: 'period must be "weekly" or "all-time"' });
    }

    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 50), 100);
    const periodStart = period === 'weekly' ? currentWeekStart() : ALL_TIME_START;
    const currentUserId = req.user?.id;

    const rows = await findLeaderboard({ period, periodStart, page, limit });
    const globalRanks = rows.map((r, i) => ({
          id: r.id,
          rank: (page - 1) * limit + i + 1,
          name: r.name,
          avatarUrl: r.avatarUrl || null,
          avatarAlt: r.avatarUrl ? `${r.name} avatar` : null,
          words: r.words,
          winRate: r.gamesPlayed > 0 ? (r.gamesWon / r.gamesPlayed) * 100 : 0,
          isCurrentUser: r.id === currentUserId,
        }));

    return res.status(200).json({
      message: 'Rankings loaded',
      globalRanks,
    })
  } catch (err) {
    next(err);
  }
}
