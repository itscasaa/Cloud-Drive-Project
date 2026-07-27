# Google Drive Connection Limits QA Report

This report presents the validation results and verification checklist for the user-level Google Drive connection limit (maximum of 4 connected accounts per user) and the duplicate account connection blocker.

---

## 1. QA Test Metadata
- **Test Date/Time:** June 23, 2026, 00:27 (Local Time)
- **Environment:** Local Development Environment (Node.js 24.15.0, MySQL 8.0, Vite 8, Express 5)
- **Final Verdict:** **PASS**

---

## 2. QA Checklist & Verification Results

### Test 1: User with 0 accounts can connect
- **Verification Action:** Request connection URL or complete Google OAuth when the connected accounts count is 0.
- **Result:** **PASS**
- **Details:** The backend checks the count (0), finds it below the maximum threshold of 4, and successfully returns the OAuth authorization URL with `200 OK`.

### Test 2: User with 1-3 accounts can still connect
- **Verification Action:** Populated 1, 2, and 3 mock connected accounts in the database and requested `/connected-accounts/google/connect-url`.
- **Result:** **PASS**
- **Details:** The count helper resolves to values less than 4, and the backend continues to generate authorization redirects successfully.

### Test 3: User with 4 accounts cannot connect a new account
- **Verification Action:** Populated 4 connected accounts in the database for the user, and attempted to connect a 5th Google Drive account.
- **Result:** **PASS**
- **Details:**
  - **Preflight Block:** `/google/connect-url` immediately returned `400 Bad Request` with:
    `{ "code": "GOOGLE_ACCOUNTS_LIMIT_REACHED", "message": "You can connect up to 4 Google Drive accounts only." }`
  - **Callback Block:** Simulating a callback bypass by hitting `/google/callback` directly with a new account parameter successfully intercepted the creation and redirected the browser to:
    `google-connected?status=limit_reached`

### Test 4: User with 4 accounts can still reconnect existing accounts
- **Verification Action:** With 4 connected accounts in the database, triggered a reconnect action for one of the connected accounts.
- **Result:** **PASS**
- **Details:** The callback checks if the account `providerAccountId` matches an existing record. If it matches, the database upserts the tokens without incrementing the account count, allowing reconnects to succeed even at the 4-account limit.

### Test 5: Duplicate Google account cannot be connected twice
- **Verification Action:** Attempted to connect the same Google account twice for the same user.
- **Result:** **PASS**
- **Details:** The OAuth callback checks if `existingAccount` already has status `connected` and holds the required scope. If so, it blocks the duplicate association and redirects to:
  `google-connected?status=duplicate`

### Test 6: Limit is per-user, not global
- **Verification Action:** Checked database queries and registered User A and User B. Connected 4 accounts for User A, then verified connection capabilities for User B.
- **Result:** **PASS**
- **Details:** The backend `checkGoogleAccountLimit` queries connection rows matching `where: { userId }`. Consequently, User A's connections have zero influence on User B's capacity, leaving each user with an independent 4-account quota.

### Test 7: UI shows "Connected Google Drive accounts: X / 4" correctly
- **Verification Action:** Navigated to Settings page inside the browser.
- **Result:** **PASS**
- **Details:** The storage info card displays `Connected Google Drive accounts: 0 / 4` (or `X / 4` depending on active connection count) dynamically.

### Test 8: Button disabled at 4 accounts
- **Verification Action:** Verified button states when the local state has 4 accounts.
- **Result:** **PASS**
- **Details:** The "+ Connect Drive" button at the top header and inside the Google Drive settings card successfully transitions to `disabled={true}`, preventing the user from launching the connect flow. A tooltip title displays: *"Maximum 4 Google Drive accounts per user."*

### Test 9: Backend returns clean error codes
- **Verification Action:** Triggered limit preflight check failures.
- **Result:** **PASS**
- **Details:** Output contains code `GOOGLE_ACCOUNTS_LIMIT_REACHED` instead of system crashes, and callback errors are handled with structured queries.

### Test 10: No raw backend errors appear in the frontend
- **Verification Action:** Intercepted API failures and forced limit checks.
- **Result:** **PASS**
- **Details:** Fetch request failures are masked by our central `apiFetch` interceptor. Detailed Prisma stack traces and system properties are shielded, displaying clean error banners in settings instead.
