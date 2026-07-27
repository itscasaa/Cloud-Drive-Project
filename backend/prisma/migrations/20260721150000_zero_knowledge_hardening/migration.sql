-- Zero-Knowledge Field-Level Encryption Migration
-- Step 1: Add email_hash columns and change varchar columns to TEXT for encrypted payloads

-- USERS TABLE
-- Change name column from varchar(191) to TEXT (will store AES ciphertext)
ALTER TABLE "users" ALTER COLUMN "name" TYPE TEXT;
-- Change email column from varchar(191) to TEXT (will store AES ciphertext)
ALTER TABLE "users" ALTER COLUMN "email" TYPE TEXT;
-- Drop old unique constraint on email (plaintext)
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key";
-- Add email_hash column (SHA-256 of original email, used for login lookups)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_hash" VARCHAR(255);
-- We'll create unique index after data migration fills in the hash values

-- CONNECTED_ACCOUNTS TABLE
-- Change email column from varchar(191) to TEXT
ALTER TABLE "connected_accounts" ALTER COLUMN "email" TYPE TEXT;
-- Change display_name column from varchar(191) to TEXT
ALTER TABLE "connected_accounts" ALTER COLUMN "display_name" TYPE TEXT;
-- Add email_hash column
ALTER TABLE "connected_accounts" ADD COLUMN IF NOT EXISTS "email_hash" VARCHAR(255);

-- USER_SESSIONS TABLE
-- Change ip_address column from varchar(64) to TEXT
ALTER TABLE "user_sessions" ALTER COLUMN "ip_address" TYPE TEXT;
-- user_agent is already TEXT, no type change needed
