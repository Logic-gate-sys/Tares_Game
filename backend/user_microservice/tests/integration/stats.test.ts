import { test, expect, describe } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { createTestUser, seedSeason } from '../helpers/testHelpers';
import { createToken } from '#utils/crypto';
import { recordGameResult } from '../../src/repositories/stats';

// Creates a user and records one game with the given word count
async function seedPlayer(words: number, won = true) {
  const user = await createTestUser();
  await recordGameResult({ userId: user.id, wordsUnscrambled: words, won });
  return user;
}



describe("Global Stats", () => {
  describe("GET: /api/v1/stats/leaderboard", () => {
    test("Returns rankings to guests without authentication", async () => {
      await seedPlayer(100);

      const res = await request(app)
        .get("/api/v1/stats/leaderboard")
        .expect(200);

      expect(res.body.message).toBeDefined();
      expect(Array.isArray(res.body.globalRanks)).toBe(true);
      expect(res.body.globalRanks.length).toBeGreaterThan(0);
    });

    test("Orders players by words unscrambled, highest first, with sequential ranks", async () => {
      await seedPlayer(120);
      await seedPlayer(480);
      await seedPlayer(260);

      const res = await request(app)
        .get("/api/v1/stats/leaderboard")
        .expect(200);

      const ranks = res.body.globalRanks;
      const words = ranks.map((r: any) => r.words);

      expect(words).toEqual([...words].sort((a: number, b: number) => b - a));
      ranks.forEach((r: any, i: number) => expect(r.rank).toBe(i + 1));
    });

    test("Does not expose sensitive user fields", async () => {
      await seedPlayer(200);

      const res = await request(app)
        .get("/api/v1/stats/leaderboard")
        .expect(200);

      for (const entry of res.body.globalRanks) {
        expect(entry).not.toHaveProperty('password');
        expect(entry).not.toHaveProperty('email');
      }
    });

    test("Rejects an unknown period with 400", async () => {
      const res = await request(app)
        .get("/api/v1/stats/leaderboard")
        .query({ period: 'monthly' })
        .expect(400);

      expect(res.body).toHaveProperty('message','period must be "weekly" or "all-time"' )
      expect(res.body.error).toBeUndefined();
    });

    test("Respects page and limit query parameters", async () => {
      await seedPlayer(300);
      await seedPlayer(200);
      await seedPlayer(100);

      const firstPage = await request(app)
        .get("/api/v1/stats/leaderboard")
        .query({ page: 1, limit: 1 })
        .expect(200);

      const secondPage = await request(app)
        .get("/api/v1/stats/leaderboard")
        .query({ page: 2, limit: 1 })
        .expect(200);

      expect(firstPage.body.globalRanks).toHaveLength(1);
      expect(secondPage.body.globalRanks).toHaveLength(1);
      expect(firstPage.body.globalRanks[0].rank).toBe(1);
      expect(secondPage.body.globalRanks[0].rank).toBe(2);
      expect(secondPage.body.globalRanks[0].id).not.toBe(firstPage.body.globalRanks[0].id);
    });
  });

  describe("GET: /api/v1/stats/global/champions", () => {
    test("Returns closed seasons with champion stats, newest season first", async () => {
      const champA = await createTestUser();
      const champB = await createTestUser();
      await seedSeason({ number: 201, closed: true, championId: champA.id, words: 9800, winRate: 89 });
      await seedSeason({ number: 203, closed: true, championId: champB.id, words: 12400, winRate: 94 });

      const res = await request(app)
        .get("/api/v1/stats/global/champions")
        console.log("RESPONSE: ", res.body)
        // .expect(200);

      const seasons = res.body.champions.map((c) => c.season);
      const idxNew = seasons.indexOf(203);
      const idxOld = seasons.indexOf(201);

      expect(idxNew).toBeGreaterThanOrEqual(0);
      expect(idxOld).toBeGreaterThanOrEqual(0);
      expect(idxNew).toBeLessThan(idxOld);

      const newest = res.body.champions[idxNew];
      expect(newest.id).toBe(champB.id);
      expect(newest.words).toBe(12400);
      expect(newest.winRate).toBe(94);
    });

    test("Excludes seasons that are still open", async () => {
      await seedSeason({ number: 202, closed: false });

      const res = await request(app)
        .get("/api/v1/stats/global/champions")
        .expect(200);

      const seasons = res.body.champions.map((c) => c.season);
      expect(seasons).not.toContain(202);
    });
  });
});
