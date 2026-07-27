# CasaNest Disconnected Account File Recovery Implementation Report

This report documents the implementation of the file recovery, warning banner, countdown badge, and automated metadata cleanup behavior when Google Drive or S3 accounts are disconnected.

---

## 1. Summary of Changes

### Database Schema Updates
- **[`schema.prisma`](file:///c:/xampp/htdocs/9drive/backend/prisma/schema.prisma)**: Added `disconnectedAt` and `recoveryExpiresAt` fields to the `ConnectedAccount` model.
- **Sync**: Executed `npx prisma db push` and `npx prisma generate` to update the local database schema and regenerate the client cleanly.

### Backend Routing & Controller Logic
- **[`connected-account.routes.ts`](file:///c:/xampp/htdocs/9drive/backend/src/modules/connected-accounts/connected-account.routes.ts)**:
  - **`DELETE /connected-accounts/:id`**: Modified to run a transaction that sets `status: 'disconnected'`, `disconnectedAt` (current date), and `recoveryExpiresAt` (current date + 3 days), while updating all associated active files to `status: 'recovery'`.
  - **`GET /google/callback` & `POST /s3`**: Added reconnection logic. If a user reconnects the same account within 3 days, recovery fields are reset to `null` and files are restored from `'recovery'` status back to `'active'`.
- **[`file.routes.ts`](file:///c:/xampp/htdocs/9drive/backend/src/modules/files/file.routes.ts)**:
  - Added the **`GET /files/recovery`** endpoint to return all files belonging to the authenticated user that are currently in `'recovery'` status, including associated account emails and remaining days.

### Automated Metadata Cleanup
- **[`cleanup-recovery.ts`](file:///c:/xampp/htdocs/9drive/backend/src/scripts/cleanup-recovery.ts)**: Created a standalone node script to sweep expired disconnected accounts (`recoveryExpiresAt <= now`) and delete them. Associated files and shares are automatically cascade-deleted by database foreign key constraints.
- **`server.ts`**: Configured to run `cleanupExpiredRecoveryMetadata` on startup and schedule it as an interval running once every hour.

### Frontend Pages & Layout
- **[`AllFilesPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/AllFilesPage.tsx)**: Updated the root empty files message to read:
  `"No active files. Connect a Google Drive account or restore from 3-Day Backup."`
- **[`RecoveryPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/RecoveryPage.tsx)**: Created a new page supporting List/Grid toggle containing:
  - **Warning Callout Banner**: Styled with the new `[3-Day Backup]` badge and countdown message.
  - **File List (Table View)**: Shows rows with file name, email, size, and the `[3-Day Backup]` pill badge with `Expires in X days` text.
  - **File Cards (Grid View)**: Displays files as grid cards with file kind icons, and displays the `[3-Day Backup]` badge next to the countdown at the bottom of the card.
  - **Reconnect Trigger**: Prominent reconnect button that redirects the user to the Google OAuth connection URL.

---

## 2. Compilation and Build Validation

Both backend and frontend build validations succeeded:

### Backend Build
```bash
> tsc
```
- **Result**: Compiles successfully with no warnings.

### Frontend Build
```bash
> tsc && vite build

vite v8.0.16 building client environment for production...
transforming...✓ 1796 modules transformed.
rendering chunks...
computing gzip size...
dist/registerSW.js                0.13 kB
dist/manifest.webmanifest         0.41 kB
dist/index.html                   1.08 kB │ gzip:   0.52 kB
dist/assets/index-l0el-_Cp.css   57.98 kB │ gzip:  10.40 kB
dist/assets/index-Di5ZH8aq.js   451.23 kB │ gzip: 125.09 kB

✓ built in 1.92s
```
- **Result**: Compiles successfully, including the updated PWA service worker asset manifest.

---

## 3. Sizing and Design Token Specifications

- **Badge Style**:
  - Background: Soft amber/yellow (`bg-amber-100`)
  - Text: Dark amber (`text-amber-800`)
  - Shape: Rounded pill (`rounded-full`)
  - Border: Subtle amber border (`border border-amber-200`)
  - Icon: Lucide `Clock` icon (`h-3.5 w-3.5` or `h-3 w-3`)
  - Text Content: `"3-Day Backup"`
- **Countdown Text**:
  - Text Content: `"Expires in X days"` (aligned next to/below the badge)

---

## 4. Verification Checklist

1. **Verify Disconnection**:
   - Go to **Connected Drives**, select an account, and click **Disconnect**.
   - Verify that its files immediately disappear from **All Files** and are replaced by the new empty state:
     `"No active files. Connect a Google Drive account or restore from 3-Day Backup."`
2. **Verify Recovery Page**:
   - Go to **Recovery & Backup** in the sidebar.
   - Verify the warning card displays the `[3-Day Backup]` badge and `"Expires in 3 days"` text.
   - Test switching between **List** and **Grid** views.
   - In **List** view: Verify the table row exhibits the `[3-Day Backup]` badge and `"Expires in X days"` text.
   - In **Grid** view: Verify each file card displays a file type icon and the `[3-Day Backup]` badge and `"Expires in X days"` text.
3. **Verify Reconnection**:
   - Click **Reconnect Google Drive** in the Recovery page.
   - Complete OAuth login with the same Google account.
   - Verify that the files are moved back to **All Files** and disappear from **Recovery & Backup**.
4. **Verify Metadata Sweeper**:
   - Mock a database record with `recoveryExpiresAt` in the past.
   - Run `npx tsx src/scripts/cleanup-recovery.ts`.
   - Verify that the account and its metadata rows are removed from the database, while the files in the user's actual Google Drive remain untouched.
