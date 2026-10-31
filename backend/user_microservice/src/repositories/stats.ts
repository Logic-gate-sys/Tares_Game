// src/repositories/stats.repository.ts
import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '#config/database';
import { PlayerStats, Seasons, Users  } from '#db/schema';
import { ALL_TIME_START, currentWeekStart } from '#utils/period';

export type StatPeriod = 'weekly' | 'all_time';

export function findChampions(limit: number) {
  return db
    .select({
      id: Users.id,
      name: Users.username,
      avatarUrl: Users.avatarUrl,
      season: Seasons.number,
      winRate: Seasons.championWinRate,
      words: Seasons.championWords,
    })
    .from(Seasons)
    .innerJoin(Users, eq(Users.id, Seasons.championId))
    .where(isNotNull(Seasons.closedAt))
    .orderBy(desc(Seasons.number))
    .limit(limit);
}

export function findLeaderboard(params: {
  period: StatPeriod;
  periodStart: Date;
  page: number;
  limit: number;
}) {
  return db
    .select({
      id: Users.id,
      name: Users.username,
      avatarUrl: Users.avatarUrl,
      words: PlayerStats.wordsUnscrambled,
      gamesPlayed: PlayerStats.gamesPlayed,
      gamesWon: PlayerStats.gamesWon,
    })
    .from(PlayerStats)
    .innerJoin(Users, eq(Users.id, PlayerStats.userId))
    .where(and(
      eq(PlayerStats.period, params.period),
      eq(PlayerStats.periodStart, params.periodStart),
    ))
    .orderBy(
      desc(PlayerStats.wordsUnscrambled),
      desc(PlayerStats.gamesWon),   // tiebreaker
      asc(PlayerStats.userId),      // stable final tiebreaker
    )
    .limit(params.limit)
    .offset((params.page - 1) * params.limit);
}

// Called when a game finishes. Updates the weekly and all-time rows in one transaction.
export async function recordGameResult(input: {
  userId: number;
  wordsUnscrambled: number;
  won: boolean;
}) {
  const won = input.won ? 1 : 0;
  const periods: { period: StatPeriod; periodStart: Date }[] = [
    { period: 'weekly', periodStart: currentWeekStart() },
    { period: 'all_time', periodStart: ALL_TIME_START },
  ];

  await db.transaction(async (tx) => {
    for (const p of periods) {
      await tx
        .insert(PlayerStats)
        .values({
          userId: input.userId,
          period: p.period,
          periodStart: p.periodStart,
          wordsUnscrambled: input.wordsUnscrambled,
          gamesPlayed: 1,
          gamesWon: won,
        })
        .onConflictDoUpdate({
          target: [PlayerStats.userId, PlayerStats.period, PlayerStats.periodStart],
          set: {
            wordsUnscrambled: sql`${PlayerStats.wordsUnscrambled} + ${input.wordsUnscrambled}`,
            gamesPlayed: sql`${PlayerStats.gamesPlayed} + 1`,
            gamesWon: sql`${PlayerStats.gamesWon} + ${won}`,
            updatedAt: new Date(),
          },
        });
    }
  });
}