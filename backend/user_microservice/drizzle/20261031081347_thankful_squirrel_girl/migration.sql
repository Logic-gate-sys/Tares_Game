CREATE TYPE "stat_period" AS ENUM('weekly', 'all_time');--> statement-breakpoint
CREATE TABLE "player_stats" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"period" "stat_period" NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"words_unscrambled" integer DEFAULT 0 NOT NULL,
	"games_played" integer DEFAULT 0 NOT NULL,
	"games_won" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" serial PRIMARY KEY,
	"number" integer NOT NULL UNIQUE,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"champion_id" integer,
	"champion_win_rate" double precision,
	"champion_words" integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX "player_stats_user_period_uq" ON "player_stats" ("user_id","period","period_start");--> statement-breakpoint
CREATE INDEX "player_stats_leaderboard_idx" ON "player_stats" ("period","period_start","words_unscrambled");--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_champion_id_users_id_fkey" FOREIGN KEY ("champion_id") REFERENCES "users"("id") ON DELETE SET NULL;