import {
  pgTable, bytea, serial, varchar, text, integer, doublePrecision,
  timestamp, pgEnum, uniqueIndex, index
} from 'drizzle-orm/pg-core';

//Users entity
export const Users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(), // hashed password
  playerLevel: varchar('p_level', { length: 50 }).default('1').notNull(),
  rank: varchar('rank', { length: 50 }).default('unranked').notNull(),
  bio: text('bio').default('').notNull(),
  totalScore: integer('total_score').default(0).notNull(),
  wins: doublePrecision('wins').default(0.0).notNull(),
  accuracy: integer('accuracy').default(0).notNull(),
  avatarUrl: text('avatar_url').default('').notNull(),
  bgClass: varchar('bg_class', { length: 250 }).default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login').defaultNow().notNull(),
});

export const Tokens = pgTable('tokens', {
  tokenHash: bytea('token_hash').primaryKey(),
  userId: integer('user_id').notNull().references(() => Users.id, { onDelete: 'cascade' }),
  expiry: timestamp('expiry', { precision: 0, withTimezone: true }).notNull(),
  scope: text('scope').notNull().default('authentication'), //  'authentication', 'password-reset'
});


// :::::::::::::::::::::::::::: GLOBAL STATS ::::::::::::::::::::::::::::::::
export const statPeriodEnum = pgEnum('stat_period', ['weekly', 'all_time']);
// One row per season. Created when a season opens and filled in when it closes.
// Champion fields are a snapshot, so the Hall of Fame stays fixed after the season ends.
export const Seasons = pgTable('seasons', {
  id: serial('id').primaryKey(),
  number: integer('number').notNull().unique(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  championId: integer('champion_id').references(() => Users.id, { onDelete: 'set null' }),
  championWinRate: doublePrecision('champion_win_rate'), // 0-100
  championWords: integer('champion_words'),
});

// One row per user per period. Weekly rows use the start of that week (UTC Monday).
// All-time rows use a fixed epoch so the unique key never contains NULL.
export const PlayerStats = pgTable('player_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => Users.id, { onDelete: 'cascade' }),
  period: statPeriodEnum('period').notNull(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  wordsUnscrambled: integer('words_unscrambled').default(0).notNull(),
  gamesPlayed: integer('games_played').default(0).notNull(),
  gamesWon: integer('games_won').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
  (t) => [
    uniqueIndex('player_stats_user_period_uq').on(t.userId, t.period, t.periodStart),
    index('player_stats_leaderboard_idx').on(t.period, t.periodStart, t.wordsUnscrambled),
  ]);

export type Season = typeof Seasons.$inferSelect;
export type NewSeason = typeof Seasons.$inferInsert;
export type PlayerStat = typeof PlayerStats.$inferSelect;
export type NewPlayerStat = typeof PlayerStats.$inferInsert;

// Schemas
export type Token = typeof Tokens.$inferSelect;
export type NewToken = typeof Tokens.$inferInsert;

// 3. Strongly-typed TypeScript interfaces from Drizzle
export type User = typeof Users.$inferSelect;
export type NewUser = typeof Users.$inferInsert;
