CREATE TABLE "completed_match_results" (
	"id" serial PRIMARY KEY,
	"match_id" varchar(128) NOT NULL,
	"user_id" integer NOT NULL,
	"score" integer NOT NULL,
	"words_unscrambled" integer NOT NULL,
	"won" integer NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "completed_match_player_uq" ON "completed_match_results" ("match_id","user_id");
--> statement-breakpoint
ALTER TABLE "completed_match_results" ADD CONSTRAINT "completed_match_results_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
