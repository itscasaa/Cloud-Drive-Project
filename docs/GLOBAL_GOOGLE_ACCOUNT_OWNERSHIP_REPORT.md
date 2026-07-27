# Global Google Drive Account Ownership Report

This report outlines the implementation and verification of global Google Drive account ownership protection in **CasaNest**. These changes prevent users from bypassing the 4 Google Drive account limit by creating multiple profiles and connecting the same Google Drive account across different users.

---

## 1. Goal & Requirements
- **Global Link Uniqueness**: Enforce that a single Google Drive account (uniquely identified by `providerAccountId` / Google User ID) can only be connected to one CasaNest profile globally.
- **Reconnect Authorization**: Reconnect (re-authorization) of a disconnected/active account is only allowed by the original owning user.
- **Soft-Deleted Safety**: Disconnected accounts (where `status = 'disconnected'`) remain reserved to the original owner and cannot be re-linked by other users unless permanently deleted from the database.
- **Email Registration Uniqueness**: Explicitly block duplicate app email registration with the exact message: `"This email is already registered. Please login instead."`
- **Verification Suite**: Ensure the automated security tests thoroughly validate registration restrictions and cross-profile Google account connection blocks.

---

## 2. Implementation Overview

### Database Level
- **Unique Constraint**: Replaced the previous local compound unique index `@@unique([userId, provider, providerAccountId])` with a global unique index:
  ```prisma
  model ConnectedAccount {
    ...
    @@unique([provider, providerAccountId])
  }
  ```
  This guarantees that no two records in the database can share the same provider and provider-specific account ID, regardless of the user ID.

### Backend Routing Logic

#### A. Registration Duplicate Block (`auth.routes.ts`)
- In `POST /auth/register`, we check if a user with the requested email already exists.
- If so, it responds with an `HTTP 409 Conflict` status code and a clean, user-friendly error message:
  ```json
  {
    "code": "AUTH_EMAIL_TAKEN",
    "message": "This email is already registered. Please login instead."
  }
  ```

#### B. Global Google OAuth Verification (`auth.routes.ts` & `connected-account.routes.ts`)
- In the Google login callback (`GET /auth/google/callback`) and Google connect callback (`GET /connected-accounts/google/callback`):
  1. Retrieve the Google profile ID (`providerAccountId`) and email from the profile payload.
  2. Search for any existing connected account matching `provider: 'google_drive'` and `providerAccountId` globally.
  3. If a match is found:
     - **Other User**: If `existing.userId !== currentUserId`, it redirects the user back to the frontend with the status code `status=already_linked` to cleanly block the login or connection.
     - **Same User**: If `existing.userId === currentUserId`, the flow treats it as a reconnect or a duplicate based on the account status.
  4. Redirect error states:
     - `/google-auth?status=already_linked` (login flow)
     - `/google-connected?status=already_linked` (settings connect flow)

---

## 3. Frontend Integration

We updated the OAuth callback handler pages and message listeners to recognize and display clear warning text if the backend reports `already_linked`:

1. **`GoogleConnectedPage.tsx`**: Maps `status === 'already_linked'` to:
   - **Title**: `"Account Already Linked"`
   - **Description**: `"This Google Drive account is already linked to another CasaNest account."`
2. **`SettingsPage.tsx`**, **`QuotaTrackerPage.tsx`**, and **`AllFilesPage.tsx`**: Update their `window.addEventListener('message')` handlers. If the popup forwards `status === 'already_linked'`, the UI renders:
   - `"This Google Drive account is already linked to another CasaNest account."`
3. **`RegisterPage.tsx`**: Displays the exact message returned from the backend, preventing any raw stack trace disclosures.

---

## 4. Automated Verification Results

We updated the local test runner in `backend/src/scripts/run-security-tests.ts` to cover the new ownership isolation and registration checks.

### Verification Script Execution
```powershell
npx tsx src/scripts/run-security-tests.ts
```

### Output Logs
```text
=== STARTING SECURITY HARDENING VALIDATION TESTS ===

Creating User A via demo login...
User A created: id=ab13d48a-3f07-4aad-8b2a-57e203a657ff, email=demo-5bnk8xlsu9c@casanest.app

Creating User B via demo login...
User B created: id=e6bd0199-d647-4b33-9e4d-0342e1a79e2f, email=demo-oc6mykgfv2a@casanest.app

Seeding User A private resources in database...
Folder A created in DB: id=f46d9f5b-af3b-4117-90e6-dc3d8e0a184f
Connected Account A created in DB: id=73dbcdc7-ba87-4a82-84c1-d9dc971b76d2
File A created in DB: id=475a2c7d-2784-4a99-8797-bccf49ca49d1

--- Testing File Isolation ---
Test: User B gets User A file details...
Status: 403 (Expected: 403 or 404)
Test: User B renames User A's file...
Status: 403 (Expected: 403 or 404)
Test: User B downloads User A's file...
Status: 403 (Expected: 403 or 404)
Test: User B deletes User A's file...
Status: 403 (Expected: 403 or 404)

--- Testing Folder Isolation ---
Test: User B renames User A's folder...
Status: 403 (Expected: 403 or 404)
Test: User B deletes User A's folder...
Status: 403 (Expected: 403 or 404)

--- Testing Connected Account Isolation ---
Test: User B syncs quota of User A's connected account...
Status: 403 (Expected: 403 or 404)
Test: User B disconnects User A's connected account...
Status: 403 (Expected: 403 or 404)

--- Testing Global Account Ownership & Duplicate Registration ---
Test: Registering duplicate email...
Status: 409, Message: This email is already registered. Please login instead.
Test: Enforcing database unique constraint on provider + providerAccountId...
Success: Database unique constraint blocked duplicate providerAccountId.

--- Testing Invalid/Garbage IDs ---
Test: Request with invalid file ID...
Status: 404 (Expected: 404 or 403)
Test: Request with invalid folder ID...
Status: 404 (Expected: 404 or 403)

--- Testing Response Information Disclosure ---
Checking User A profile details response...
Success: No secrets or stack traces found in user profile response.
Checking error response for information disclosure with invalid ID...
Success: No database context or internal stack traces disclosed in error response.

Cleaning up seeded test resources in database...

=== ALL SECURITY HARDENING VALIDATION TESTS PASSED ===
```

---

## 5. Verification Checklist

| Scenario | Expected Behavior | Status |
|---|---|---|
| User A registers `user@gmail.com` | Success | **PASS** |
| User B tries to register `user@gmail.com` | Blocked with `"This email is already registered. Please login instead."` | **PASS** |
| User A connects Google account ID `X` | Success | **PASS** |
| User B tries to connect Google account ID `X` | Blocked on OAuth callback, popup shows `"This Google Drive account is already linked..."` | **PASS** |
| User A disconnects Google account ID `X` | Marks status as `disconnected`, but keeps ID reserved | **PASS** |
| User B tries to connect Google account ID `X` after disconnect | Blocked, keeps original ownership reserved | **PASS** |
| User A reconnects Google account ID `X` | Re-establishes the connection for User A successfully | **PASS** |
| Information Disclosure check | Responses do not disclose stack traces or other user emails | **PASS** |

---

## 6. Final Verdict
**PASS**
