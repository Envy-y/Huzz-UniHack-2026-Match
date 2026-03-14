-- AlterTable MatchPlayer: add paid_at
ALTER TABLE "MatchPlayer" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3);

-- AlterTable Notification: add notification_type and match_id
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "notification_type" TEXT NOT NULL DEFAULT 'lobby_update';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "match_id" TEXT;
