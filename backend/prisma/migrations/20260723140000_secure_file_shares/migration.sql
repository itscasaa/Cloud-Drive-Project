-- Secure public share links: download toggle, optional password, usage counters
ALTER TABLE "file_shares" ADD COLUMN IF NOT EXISTS "allow_download" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "file_shares" ADD COLUMN IF NOT EXISTS "password_hash" VARCHAR(255);
ALTER TABLE "file_shares" ADD COLUMN IF NOT EXISTS "view_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "file_shares" ADD COLUMN IF NOT EXISTS "download_count" INTEGER NOT NULL DEFAULT 0;
