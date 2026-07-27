# CasaNest Exhibition & Production Readiness Plan

This document serves as a comprehensive checklist and strategy guide to prepare **CasaNest** for a public exhibition, ensuring safe handling of multiple users, Google verification compliance, and robust backup fallback mechanisms.

---

## 1. OAuth Production Checklist

Before the exhibition, the app owner must transition the Google Cloud project out of Google OAuth Testing mode to Production.

- [ ] **Scopes Verification:** Update application scopes to request least-privileged file access:
  - `https://www.googleapis.com/auth/drive.file` (access/create app-specific files/folders only)
  - `https://www.googleapis.com/auth/userinfo.email` (read user's email address)
  - `https://www.googleapis.com/auth/userinfo.profile` (read user's display name and profile picture)
- [ ] **Authorized JavaScript Origins:**
  - Add your production frontend domain (e.g., `https://9drive.app` or `http://exhibition-ip:5173`) to the Google Cloud OAuth client.
- [ ] **Authorized Redirect URIs:**
  - Add your production backend callback domain (e.g., `https://api.casanest.app/connected-accounts/google/callback` or `http://exhibition-ip:4000/connected-accounts/google/callback`).
- [ ] **OAuth Consent Screen Details:**
  - Provide a valid App name, support email, and developer contact information.
  - Upload an application logo (optional, requires verification).
  - Link the public legal pages (Privacy Policy, Terms of Service, Data Deletion request instructions).

---

## 2. Google Verification Checklist

Because CasaNest uses the restricted `.file` drive scope, it may require a verification review by Google if it serves external users.

- [ ] **Prepare Public Legal URLs:**
  - Deployment must expose public links to `/privacy` (Privacy Policy) and `/terms` (Terms of Service).
  - Exposure of `/data-deletion` instructions is mandatory.
- [ ] **Record Verification Demo Video:**
  - Record a screencast showing how users sign up, log in, connect their Google Drive, and how files are uploaded and synced.
  - Show the Google OAuth consent flow, making sure the client ID in the URL is visible.
  - Highlight the permission screen showing the app requests *only* limited access to "Files created or opened by this app".
- [ ] **Submit for Review:**
  - Go to Google Cloud Console > APIs & Services > OAuth consent screen.
  - Click **Submit for Verification** and provide the link to the YouTube/Drive demo video.

---

## 3. Demo Mode Fallback Plan

For exhibition visitors who do not want to connect their personal Google Drive, **Demo Mode** acts as a zero-setup fallback.

- [ ] **Admin Account Configuration:**
  - The app owner must register the first account (automatically assigned `admin` role) and connect a dedicated Google Drive account owned by the organization.
- [ ] **Mapping Owner Storage:**
  - The backend intercepts any uploads or quota checks for sessions with `role: 'demo'`.
  - Demo files are physically uploaded to the admin's connected Drive folder (`casanest`).
  - Metadata is saved in the database with the individual demo user's `userId`, keeping the workspaces isolated from other visitors.
- [ ] **Fair Usage Limits:**
  - Enforce a strict 5MB upload size limit per file for demo users to prevent server resource or admin Google Drive exhaustion.
- [ ] **Demo Data Cleanup Route:**
  - Administrators can trigger a data wipe to clear temporary files and DB records for demo users safely.

---

## 4. Security Checklist

Ensure the following security hardening steps are completed on the production server:

- [ ] **Refresh Token Encryption:** Google refresh tokens must always be encrypted with AES-256 using the `TOKEN_ENCRYPTION_KEY` in the environment.
- [ ] **HttpOnly Cookie Sessions:** Centralize token refreshes and use secure transport (HTTPS) for production access.
- [ ] **Rate Limiting Middleware:**
  - Enabled 10 requests/min rate limiting on authentication routes (`/login`, `/register`, `/demo-login`) to prevent brute-forcing.
  - Enabled 20 requests/min rate limiting on OAuth redirection endpoints (`/google/callback`).
- [ ] **Error Masking:**
  - Confirm Prisma database client exceptions and raw Express 500 error objects are shielded from the client to prevent stack trace or credentials leaks.
- [ ] **Query Scoping:** Ensure all file, folder, and config lookup queries check the active `userId` session filter constraint.

---

## 5. Deployment Checklist

To run CasaNest in a live, multi-user production environment:

- [ ] **Environment Setup:**
  - Copy and configure `.env` on the host machine.
  - Ensure `JWT_ACCESS_SECRET` and `TOKEN_ENCRYPTION_KEY` are at least 32 characters long.
  - Keep `DATABASE_URL` pointed to a secured MySQL instance.
- [ ] **OAuth Client ID Seed:**
  - Run `npm run seed:google-config` to write the client ID and secret safely to the encrypted database configurations table.
- [ ] **HTTPS / Reverse Proxy:**
  - Configure Nginx or Caddy to run reverse proxying over HTTPS, forwarding traffic securely to the React frontend (port 5173/nginx) and the Express backend API (port 4000).
  - Setup SSL certificates using Let's Encrypt.
