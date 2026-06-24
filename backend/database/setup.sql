-- ==========================================
-- CasaNest MySQL Database Setup Script
-- Compatible with MySQL 8.0+ and MariaDB (XAMPP / phpMyAdmin)
-- ==========================================

-- 1. Create Database if it does not exist
CREATE DATABASE IF NOT EXISTS `9drive`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `9drive`;

-- Temporarily disable foreign key checks to ensure safe creation in any order
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- Table: users
-- Description: Stores user credentials, email, verification status, and timestamps.
-- ==========================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` CHAR(36) NOT NULL COMMENT 'UUID uniquely identifying the user',
    `name` VARCHAR(191) NOT NULL COMMENT 'User display name',
    `email` VARCHAR(191) NOT NULL COMMENT 'User email address',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Argon2 hash of the password',
    `status` VARCHAR(32) NOT NULL DEFAULT 'active' COMMENT 'User account status (e.g. active, suspended)',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Creation timestamp',
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'Last updated timestamp',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: api_keys
-- Description: Stores API keys for programmatic uploads and external access.
-- ==========================================
CREATE TABLE IF NOT EXISTS `api_keys` (
    `id` CHAR(36) NOT NULL COMMENT 'UUID uniquely identifying the API key record',
    `user_id` CHAR(36) NOT NULL COMMENT 'Owner of the API key',
    `name` VARCHAR(191) NOT NULL COMMENT 'Friendly name for the key',
    `key_prefix` VARCHAR(32) NOT NULL COMMENT 'First few chars displayed in UI',
    `key_hash` VARCHAR(255) NOT NULL COMMENT 'Secure hash of the API key',
    `scopes` JSON NOT NULL COMMENT 'JSON array of scopes granted to this key',
    `status` VARCHAR(32) NOT NULL DEFAULT 'active' COMMENT 'Key status (active, revoked)',
    `last_used_at` DATETIME(3) NULL COMMENT 'Last request timestamp using this key',
    `expires_at` DATETIME(3) NULL COMMENT 'Optional key expiration timestamp',
    `revoked_at` DATETIME(3) NULL COMMENT 'Optional timestamp indicating when key was revoked',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `api_keys_key_hash_key` (`key_hash`),
    INDEX `api_keys_user_id_idx` (`user_id`),
    INDEX `api_keys_user_id_status_created_at_idx` (`user_id`, `status`, `created_at`),
    CONSTRAINT `api_keys_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: upload_routing_policies
-- Description: Configures the routing policy for uploads when distributing files to storage channels.
-- ==========================================
CREATE TABLE IF NOT EXISTS `upload_routing_policies` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL COMMENT 'User who owns this routing policy',
    `mode` VARCHAR(32) NOT NULL DEFAULT 'most_available' COMMENT 'Mode: most_available, round_robin, priority_order',
    `priority_account_ids` JSON NOT NULL COMMENT 'JSON array of priority connected account IDs',
    `round_robin_cursor` INT NOT NULL DEFAULT 0 COMMENT 'Cursor pointing to current index for round robin routing',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `upload_routing_policies_user_id_key` (`user_id`),
    CONSTRAINT `upload_routing_policies_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: user_sessions
-- Description: Tracks active login sessions and holds refresh token hashes.
-- ==========================================
CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `refresh_token_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed refresh token',
    `user_agent` TEXT NULL COMMENT 'User agent from login request',
    `ip_address` VARCHAR(64) NULL COMMENT 'IP address of user session',
    `expires_at` DATETIME(3) NOT NULL COMMENT 'Session expiry timestamp',
    `revoked_at` DATETIME(3) NULL COMMENT 'Timestamp when session was explicitly logged out/revoked',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `user_sessions_user_id_idx` (`user_id`),
    INDEX `user_sessions_refresh_token_hash_idx` (`refresh_token_hash`),
    CONSTRAINT `user_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: auth_handoffs
-- Description: Stores temporary handoff tokens used to securely transfer OAuth details to app sessions.
-- ==========================================
CREATE TABLE IF NOT EXISTS `auth_handoffs` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed one-time handoff token',
    `expires_at` DATETIME(3) NOT NULL COMMENT 'Token expiry timestamp',
    `used_at` DATETIME(3) NULL COMMENT 'Timestamp when token was successfully redeemed',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `auth_handoffs_token_hash_key` (`token_hash`),
    INDEX `auth_handoffs_user_id_idx` (`user_id`),
    CONSTRAINT `auth_handoffs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: provider_configs
-- Description: Stores global or user-specific OAuth credentials for providers like Google.
-- ==========================================
CREATE TABLE IF NOT EXISTS `provider_configs` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NULL COMMENT 'Null for global system configurations',
    `provider` VARCHAR(32) NOT NULL COMMENT 'e.g. google',
    `client_id_encrypted` TEXT NOT NULL COMMENT 'Encrypted Client ID',
    `client_secret_encrypted` TEXT NOT NULL COMMENT 'Encrypted Client Secret',
    `redirect_uri` TEXT NOT NULL COMMENT 'OAuth Redirect URI',
    `scopes` JSON NOT NULL COMMENT 'JSON array of OAuth scopes',
    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `provider_configs_user_id_idx` (`user_id`),
    INDEX `provider_configs_provider_idx` (`provider`),
    CONSTRAINT `provider_configs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: oauth_states
-- Description: Prevents CSRF attacks during external OAuth flows.
-- ==========================================
CREATE TABLE IF NOT EXISTS `oauth_states` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NULL,
    `provider_config_id` CHAR(36) NOT NULL,
    `flow` VARCHAR(32) NOT NULL DEFAULT 'connect' COMMENT 'e.g. login, register, connect',
    `state_hash` VARCHAR(255) NOT NULL COMMENT 'Secure hash of the state parameter',
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `oauth_states_state_hash_key` (`state_hash`),
    INDEX `oauth_states_user_id_idx` (`user_id`),
    CONSTRAINT `oauth_states_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `oauth_states_provider_config_id_fkey` FOREIGN KEY (`provider_config_id`) REFERENCES `provider_configs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: connected_accounts
-- Description: Stores encrypted tokens of linked external Drive/S3 accounts.
-- ==========================================
CREATE TABLE IF NOT EXISTS `connected_accounts` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `provider_config_id` CHAR(36) NULL,
    `provider` VARCHAR(32) NOT NULL COMMENT 'e.g. google_drive, s3',
    `provider_account_id` VARCHAR(191) NOT NULL COMMENT 'Unique ID on provider service (e.g. Google User ID)',
    `email` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NULL,
    `avatar_url` TEXT NULL,
    `access_token_encrypted` TEXT NULL,
    `refresh_token_encrypted` TEXT NULL,
    `token_expires_at` DATETIME(3) NULL,
    `scopes` JSON NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'connected',
    `last_error` TEXT NULL COMMENT 'Stores sync/connection error messages if any',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `connected_accounts_user_id_provider_provider_account_id_key` (`user_id`, `provider`, `provider_account_id`),
    INDEX `connected_accounts_user_id_idx` (`user_id`),
    INDEX `connected_accounts_user_id_status_created_at_idx` (`user_id`, `status`, `created_at`),
    CONSTRAINT `connected_accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `connected_accounts_provider_config_id_fkey` FOREIGN KEY (`provider_config_id`) REFERENCES `provider_configs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: s3_storage_configs
-- Description: Configuration details for customized S3 storage backends.
-- ==========================================
CREATE TABLE IF NOT EXISTS `s3_storage_configs` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `connected_account_id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL COMMENT 'Friendly label for display',
    `bucket` VARCHAR(191) NOT NULL COMMENT 'S3 bucket name',
    `region` VARCHAR(191) NOT NULL COMMENT 'S3 region',
    `endpoint` TEXT NULL COMMENT 'Custom endpoint URL (e.g. MinIO, Cloudflare R2)',
    `access_key_id_encrypted` TEXT NOT NULL,
    `secret_access_key_encrypted` TEXT NOT NULL,
    `force_path_style` TINYINT(1) NOT NULL DEFAULT 0,
    `prefix` VARCHAR(191) NOT NULL DEFAULT 'casanest' COMMENT 'S3 prefix path directory',
    `quota_bytes` BIGINT NULL COMMENT 'Configurable virtual storage quota in bytes',
    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `s3_storage_configs_connected_account_id_key` (`connected_account_id`),
    INDEX `s3_storage_configs_user_id_idx` (`user_id`),
    INDEX `s3_storage_configs_user_id_status_idx` (`user_id`, `status`),
    CONSTRAINT `s3_storage_configs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `s3_storage_configs_connected_account_id_fkey` FOREIGN KEY (`connected_account_id`) REFERENCES `connected_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: storage_accounts
-- Description: Holds current quota stats (total, used, trash, etc.) synced from remote storages.
-- ==========================================
CREATE TABLE IF NOT EXISTS `storage_accounts` (
    `id` CHAR(36) NOT NULL,
    `connected_account_id` CHAR(36) NOT NULL,
    `total_bytes` BIGINT NULL,
    `used_bytes` BIGINT NOT NULL DEFAULT 0,
    `available_bytes` BIGINT NULL,
    `trash_bytes` BIGINT NULL,
    `last_synced_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `storage_accounts_connected_account_id_key` (`connected_account_id`),
    CONSTRAINT `storage_accounts_connected_account_id_fkey` FOREIGN KEY (`connected_account_id`) REFERENCES `connected_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: folders
-- Description: Stores virtual folders created by users to group files locally.
-- ==========================================
CREATE TABLE IF NOT EXISTS `folders` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `parent_id` CHAR(36) NULL COMMENT 'Enables nested folders',
    `connected_account_id` CHAR(36) NULL COMMENT 'Optionally binds a folder to a target storage account',
    `provider` VARCHAR(32) NOT NULL DEFAULT 'google_drive' COMMENT 'Storage provider type',
    `provider_folder_id` VARCHAR(191) NULL COMMENT 'Remote folder ID if physical folders are mirrored',
    `name` VARCHAR(255) NOT NULL,
    `color` VARCHAR(64) NOT NULL DEFAULT 'text-blue-500',
    `icon_url` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL COMMENT 'Soft-deletion timestamp',
    PRIMARY KEY (`id`),
    INDEX `folders_user_id_idx` (`user_id`),
    INDEX `folders_user_id_deleted_at_updated_at_idx` (`user_id`, `deleted_at`, `updated_at`),
    INDEX `folders_user_id_deleted_at_parent_id_updated_at_idx` (`user_id`, `deleted_at`, `parent_id`, `updated_at`),
    INDEX `folders_parent_id_idx` (`parent_id`),
    INDEX `folders_connected_account_id_idx` (`connected_account_id`),
    CONSTRAINT `folders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `folders_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `folders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `folders_connected_account_id_fkey` FOREIGN KEY (`connected_account_id`) REFERENCES `connected_accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: files
-- Description: Stores metadata of files synced or uploaded to connected Google Drive / S3 storage.
-- ==========================================
CREATE TABLE IF NOT EXISTS `files` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `connected_account_id` CHAR(36) NOT NULL,
    `folder_id` CHAR(36) NULL,
    `provider` VARCHAR(32) NOT NULL COMMENT 'Storage provider name (e.g. google_drive, s3)',
    `provider_file_id` VARCHAR(191) NOT NULL COMMENT 'File ID inside the remote storage (e.g. Google File ID or S3 Key)',
    `name` VARCHAR(255) NOT NULL COMMENT 'Filename with extension',
    `mime_type` VARCHAR(191) NOT NULL,
    `size_bytes` BIGINT NOT NULL,
    `checksum` VARCHAR(191) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'active' COMMENT 'active, deleted',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL COMMENT 'Soft-deletion timestamp',
    PRIMARY KEY (`id`),
    INDEX `files_user_id_idx` (`user_id`),
    INDEX `files_user_id_status_created_at_idx` (`user_id`, `status`, `created_at`),
    INDEX `files_user_id_status_folder_id_created_at_idx` (`user_id`, `status`, `folder_id`, `created_at`),
    INDEX `files_connected_account_id_idx` (`connected_account_id`),
    INDEX `files_folder_id_idx` (`folder_id`),
    INDEX `files_provider_file_id_idx` (`provider_file_id`),
    CONSTRAINT `files_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `files_connected_account_id_fkey` FOREIGN KEY (`connected_account_id`) REFERENCES `connected_accounts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `files_folder_id_fkey` FOREIGN KEY (`folder_id`) REFERENCES `folders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: file_shares
-- Description: Stores shareable public links generated for files.
-- ==========================================
CREATE TABLE IF NOT EXISTS `file_shares` (
    `id` CHAR(36) NOT NULL,
    `file_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `token` VARCHAR(191) NULL COMMENT 'Share token string',
    `token_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed share token for database lookup',
    `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Flag to easily toggle sharing',
    `expires_at` DATETIME(3) NULL COMMENT 'Sharing link expiration',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `file_shares_token_key` (`token`),
    UNIQUE INDEX `file_shares_token_hash_key` (`token_hash`),
    INDEX `file_shares_file_id_idx` (`file_id`),
    INDEX `file_shares_user_id_idx` (`user_id`),
    INDEX `file_shares_user_id_enabled_created_at_idx` (`user_id`, `enabled`, `created_at`),
    INDEX `file_shares_file_id_user_id_enabled_created_at_idx` (`file_id`, `user_id`, `enabled`, `created_at`),
    CONSTRAINT `file_shares_file_id_fkey` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `file_shares_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: file_preview_tokens
-- Description: Temporarily grants authenticated file streams for embeds/media player previews.
-- ==========================================
CREATE TABLE IF NOT EXISTS `file_preview_tokens` (
    `id` CHAR(36) NOT NULL,
    `file_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed short-lived token',
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `file_preview_tokens_token_hash_key` (`token_hash`),
    INDEX `file_preview_tokens_file_id_idx` (`file_id`),
    INDEX `file_preview_tokens_user_id_idx` (`user_id`),
    CONSTRAINT `file_preview_tokens_file_id_fkey` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `file_preview_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: upload_sessions
-- Description: Tracks ongoing streaming uploads to remote storage services.
-- ==========================================
CREATE TABLE IF NOT EXISTS `upload_sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `target_connected_account_id` CHAR(36) NULL COMMENT 'Storage target connected account',
    `file_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `size_bytes` BIGINT NOT NULL,
    `status` VARCHAR(32) NOT NULL COMMENT 'pending, uploading, completed, failed',
    `error_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,
    PRIMARY KEY (`id`),
    INDEX `upload_sessions_user_id_idx` (`user_id`),
    CONSTRAINT `upload_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `upload_sessions_target_connected_account_id_fkey` FOREIGN KEY (`target_connected_account_id`) REFERENCES `connected_accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: audit_logs
-- Description: Records security and storage activities performed by users.
-- ==========================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NULL,
    `action` VARCHAR(191) NOT NULL COMMENT 'Performed action label (e.g. login, delete_file)',
    `entity_type` VARCHAR(191) NOT NULL COMMENT 'Affected component type',
    `entity_id` CHAR(36) NULL COMMENT 'Target entity identifier',
    `metadata` JSON NULL COMMENT 'Key-value details of the action',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `audit_logs_user_id_idx` (`user_id`),
    CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- Table: workspace_invites
-- Description: Manages invitations to share access to files and folders with external users.
-- ==========================================
CREATE TABLE IF NOT EXISTS `workspace_invites` (
    `id` CHAR(36) NOT NULL,
    `inviter_id` CHAR(36) NOT NULL,
    `invitee_email` VARCHAR(191) NOT NULL,
    `target_type` VARCHAR(32) NOT NULL DEFAULT 'file' COMMENT 'file or folder invite',
    `target_id` CHAR(36) NOT NULL DEFAULT '' COMMENT 'UUID of shared file/folder',
    `role` VARCHAR(32) NOT NULL DEFAULT 'viewer' COMMENT 'viewer, editor',
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending' COMMENT 'pending, accepted, revoked',
    `revoked_at` DATETIME(3) NULL,
    `accepted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `workspace_invites_target_unique` (`inviter_id`, `invitee_email`, `target_type`, `target_id`),
    INDEX `workspace_invites_invitee_email_idx` (`invitee_email`),
    INDEX `workspace_invites_target_type_target_id_idx` (`target_type`, `target_id`),
    CONSTRAINT `workspace_invites_inviter_id_fkey` FOREIGN KEY (`inviter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
