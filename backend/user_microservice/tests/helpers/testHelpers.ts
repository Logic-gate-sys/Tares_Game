import { createToken } from '../../src/utils/crypto.ts';
import { hashPassword } from '../../src/utils/crypto.ts';
import { pool, db } from '../../src/config/database.ts';
import { Seasons} from '../../src/db/schema.ts'
import type { SignupData, } from '../../src/schemas/auth.ts'



type TestUser = {
  id: number;
  email: string;
  username: string;
  p_level?: string;
  rawPassword: string;
  token?: unknown; 
}

const defaultPassword = 'Password123!';

export async function createTestUser(overrides: Partial<SignupData> = {}): Promise<TestUser> {
  const rawPassword = overrides.password ?? defaultPassword;
  const email = overrides.email ?? `someone${Math.random()}@gmail.com`;
  const username = overrides.username ?? `user-${Date.now()}-${Math.random()}`;
  const hashedPassword = await hashPassword(rawPassword); 
  const result = await pool.query<TestUser>(
    `INSERT INTO users (email, username, password, p_level, rank, bio, total_score, avatar_url, bg_class)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, email, username, p_level`,
    
    [
      email,
      username,
      hashedPassword,
      '1',
      'unranked',
      'Test user',
       0,
      'https://res.cloudinary.com/test/avatar.jpg',
      'default',
    ],
  );
  const user = result.rows[0]!;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    rawPassword,
    token: createToken({
      email: user.email,
      username: user.username,
      id: user.id
    }, 60 * 60),
  };
}


export async function seedSeason(opts: {
  number: number;
  closed: boolean;
  championId?: number;
  words?: number;
  winRate?: number;
}) {
  await db.insert(Seasons).values({
    number: opts.number,
    startsAt: new Date('2026-01-01T00:00:00Z'),
    endsAt: new Date('2026-03-31T23:59:59Z'),
    closedAt: opts.closed ? new Date('2026-04-01T00:00:00Z') : null,
    championId: opts.championId ?? null,
    championWords: opts.words ?? null,
    championWinRate: opts.winRate ?? null,
  });
};
