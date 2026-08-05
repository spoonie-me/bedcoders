-- Cumulative count of distinct active days, replacing the consecutive-day streak
-- in all user-facing surfaces. Only ever increments; a gap costs nothing.
ALTER TABLE "bedcoders"."Gamification" ADD COLUMN "daysLearned" INTEGER NOT NULL DEFAULT 0;

-- Preserve something meaningful for existing learners rather than showing 0:
-- their best previous streak is the closest available lower bound on how many
-- days they actually showed up.
UPDATE "bedcoders"."Gamification" SET "daysLearned" = GREATEST("bestStreak", "currentStreak");
