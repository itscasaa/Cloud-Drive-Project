# CasaNest 3-Day Backup Tag Visibility & Exclusivity Fix Report

This report documents the verification and fixes performed to ensure that recovery files and the `[3-Day Backup]` badge are displayed exclusively on the **Recovery & Backup** page, and that files from disconnected accounts disappear from **All Files** immediately and reappear upon reconnecting.

---

## 1. Verification of Requirements & Implementation Details

### Requirement 1: Database Files Table After Disconnect
* **Implementation**: The transaction in `connectedAccountRouter.delete('/:id')` in [`connected-account.routes.ts`](file:///c:/xampp/htdocs/9drive/backend/src/modules/connected-accounts/connected-account.routes.ts) executes:
  - Updates the `ConnectedAccount` status to `'disconnected'`.
  - Sets `disconnectedAt = new Date()`.
  - Sets `recoveryExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)` (3 days countdown).
  - Updates all associated files (`connectedAccountId = id`) with `status = 'recovery'` in the database transaction.
* **Verification**: Fully implemented. When a user deletes a connected drive, the records are correctly updated in a single transactional write.

### Requirement 2: All Files API Query Filter
* **Implementation**: The file query router `GET /files` in [`file.routes.ts`](file:///c:/xampp/htdocs/9drive/backend/src/modules/files/file.routes.ts) handles retrieving active files.
  - Queries files where `status === 'active'`.
  - Filters out disconnected accounts by ensuring `connectedAccount: { status: 'connected' }`.
* **Verification**: Fulfills the requirement that recovery files and files from disconnected accounts are excluded from the main All Files list.

### Requirement 3: Recovery API Endpoint
* **Implementation**: The endpoint `GET /files/recovery` in [`file.routes.ts`](file:///c:/xampp/htdocs/9drive/backend/src/modules/files/file.routes.ts):
  - Explicitly filters files by `userId` and `status === 'recovery'`.
  - Includes the email of the disconnected account and its `recoveryExpiresAt` timestamp.
* **Verification**: Fulfills the requirement. Only files with status `'recovery'` are fetched by the recovery page.

### Requirement 4: RecoveryPage UI Badge Visibility
* **Implementation**: The component [`RecoveryPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/RecoveryPage.tsx) renders the `3-Day Backup` pill badge visibly in both List and Grid views.
  - **List View**: Renders the warning badge alongside the remaining days computed dynamically.
    ```typescript
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 shadow-sm border border-amber-200">
      <Clock className="h-3 w-3" />
      3-Day Backup
    </span>
    <span>Expires in {daysLeft} days</span>
    ```
  - **Grid View**: Renders the file cards with the corresponding badge and countdown at the bottom of the card.
* **Verification**: The layout supports view toggle (`List` / `Grid`) and displays the badge prominently under recovery conditions.

### Requirement 5: Clear Frontend Cache & State Post-Disconnect/Connect
* **Implementation**:
  - **Settings Page**: Added event dispatching `window.dispatchEvent(new Event('casanest:storage-changed'))` in [`SettingsPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/SettingsPage.tsx) inside the disconnect, reconnect, sync, and S3 connection handlers. This guarantees that the main application shell and sidebar statistics update immediately when a drive's connectivity state is updated.
  - **Recovery Page**: Modified the reconnection action to trigger a popup flow using `window.open` (matching the settings page logic) and registered a message listener for the `GOOGLE_CONNECTED` postMessage. When the OAuth connection succeeds, `RecoveryPage.tsx` automatically:
    1. Refetches the recovery files list using `loadRecoveryFiles()`.
    2. Dispatches `casanest:storage-changed` to sync the main dashboard sidebar statistics.
* **Verification**: Solves potential stale UI state issues on both connection and disconnection transitions.

---

## 2. Compilation Verification

- **Frontend Compilation**: Ran `npm run build` inside `frontend/`. Completed successfully with no errors or type check warnings.
- **Backend Compilation**: Ran `npm run build` inside `backend/`. Completed successfully.

---

## 3. Exclusivity Summary

| Feature | All Files Page / Components | Recovery & Backup Page |
| :--- | :---: | :---: |
| **Active Files** | Yes | No |
| **Recovery Files** | No | Yes |
| **`[3-Day Backup]` Badge** | No | Yes |
| **`Expires in X days` Text** | No | Yes |
