# Security & Privacy Documentation

This document describes how **CasaNest** manages data storage, Google OAuth security, user data boundaries, and encryption.

---

## 1. Google Drive OAuth Scopes & Data Access

CasaNest is designed with a **privacy-first** approach. The application uses the restricted, least-privileged scope for Google Drive access:

```
https://www.googleapis.com/auth/drive.file
```

### Key Differences from Full Scope (`/auth/drive`):
- **App-Specific Access:** Under the `.file` scope, CasaNest only has permissions to view, modify, and delete files and folders that were **created or uploaded directly through this application**.
- **No Global Scanning:** CasaNest cannot scan, read, modify, or delete any preexisting files or folders in your Google Drive that were created outside of CasaNest.
- **Improved Security Profile:** By restricting access, the risk of data leakage is minimized, and the verification process with Google is significantly easier.

---

## 2. Storage Boundaries & Metadata

CasaNest acts as a storage gateway, meaning your files are never saved on CasaNest's own servers.

- **Streaming Uploads:** File data uploaded through the dashboard is streamed in real-time through the Express backend directly to your Google Drive. No physical files are cached or stored on the server's local disk.
- **Database Records:** The application's database only holds:
  - User profiles (names, hashed emails).
  - Virtual folder layouts (virtual workspace structures, custom icons).
  - File metadata (file names, sizes, MIME types, and corresponding Google File IDs).
  - Encrypted credential tokens.
- **Demo Mode Isolation:** When visitors log in using **Demo Mode**, their files are physically uploaded to the admin's pre-connected storage account. However, their workspace layouts, folders, and file listings remain isolated to their own `userId` records in MySQL, meaning different visitors cannot view or access each other's uploads.

---

## 3. Token Encryption & Storage

To keep credentials secure:
- **AES-256 Encryption:** All Google OAuth refresh tokens and S3 secrets are strongly encrypted at-rest using AES-256 (via the `TOKEN_ENCRYPTION_KEY` configured in the backend `.env`).
- **No Browser Token Storage:** App session access/refresh tokens are stored as HttpOnly, secure cookies or verified bearer headers. Google credentials and access tokens are **never** stored in the browser's `localStorage` or `sessionStorage`.

---

## 4. Reconnect Requirements (Transition to drive.file)

If you are migrating an existing CasaNest deployment from the legacy full `drive` scope to the new `drive.file` scope:

1. **Force Reconnection:** To prevent unexpected access or mixed-scope states, CasaNest flags existing connected accounts lacking the `drive.file` scope in their database metadata.
2. **Dashboard Badge:** A prominent `⚠️ Reconnect Required` badge will display next to these accounts on the Settings page.
3. **Restricted Actions:** Uploads and quota syncs are disabled for accounts that require reconnection.
4. **Self-Service Resolution:** The user can restore functionality by clicking the **Reconnect** button on the Settings page to authorize the new, safer scope.

---

## 5. Administration & Configuration

CasaNest operates with an owner-configured gateway model:
- **Global OAuth Credentials:** The application owner configures exactly **one** Google OAuth Client ID and Client Secret in the backend `.env` file (or via the bootstrap admin dashboard).
- **No User Input Needed:** End-users register/login with their email/password and click **Add Google Drive**. They do not need to supply their own Client IDs or Secrets, making the authorization flow simple and secure.

---

## 6. Storage Connection Limits per User

To ensure optimal performance, prevent connection abuse, and keep user storage allocation scaling balanced:
- **Maximum 4 Google Drive Accounts:** Each user is permitted to connect up to a maximum of 4 Google Drive accounts. Disconnected or soft-deleted accounts do not count towards this limit.
- **Duplicate Connection Check:** If a user attempts to connect a Google account that is already actively connected under their profile, the flow is blocked, and the database upsert is restricted. This prevents data redundancy and state overlap.
