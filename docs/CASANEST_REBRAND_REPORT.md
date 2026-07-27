# CasaNest Rebranding Report

This report documents the rebranding of the **9Drive** application to **CasaNest**, including code replacements, default database schema defaults, legal pages updates, and build confirmations.

---

## 1. Summary of Changes
- **App Name**: Changed from **9Drive** to **CasaNest** across all user-facing layouts, sidebar titles, headers, logins, registrations, terms, privacy, and page titles.
- **Tagline**: Configured to:
  `"Secure storage nest for your connected drives."`
- **Google Drive App Folder Name**: Modified the root folder created in users' Google Drives from `'9drive'` to `'casanest'`.
- **Default S3 Prefix**: Changed the default schema prefix for custom S3 buckets from `"9drive"` to `"casanest"`.
- **Custom Application Events**: Changed communication event names in layout and pages from `9drive:storage-changed` to `casanest:storage-changed`, and `9drive:invites-changed` to `casanest:invites-changed`.
- **Auth Storage Keys**: Updated local user session storage prefix from `9drive.user` to `casanest.user`.
- **Demo Accounts**: Updated registered demo user email domain suffix from `@9drive.app` to `@casanest.app`.

---

## 2. Rebranded Files

| Component | File Path | Changes Made |
|---|---|---|
| **Database** | [`schema.prisma`](file:///c:/xampp/htdocs/9drive/backend/prisma/schema.prisma) | Changed default prefix in `S3StorageConfig` to `"casanest"` |
| | [`setup.sql`](file:///c:/xampp/htdocs/9drive/backend/database/setup.sql) | Rebranded SQL headers and default S3 prefix comments |
| **Backend** | [`google.service.ts`](file:///c:/xampp/htdocs/9drive/backend/src/modules/google/google.service.ts) | Updated `appFolderName` to `'casanest'` |
| | [`auth.routes.ts`](file:///c:/xampp/htdocs/9drive/backend/src/modules/auth/auth.routes.ts) | Updated demo registration email domain |
| **Frontend Layout** | [`DriveLayout.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/layouts/DriveLayout.tsx) | Updated sidebar title, header text, and custom storage event |
| | [`BrandLogo.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/components/drive/BrandLogo.tsx) | Updated SVG `aria-label` to `"CasaNest logo"` |
| **Frontend Configs** | [`index.html`](file:///c:/xampp/htdocs/9drive/frontend/index.html) | Updated HTML title tags and description |
| | [`vite.config.ts`](file:///c:/xampp/htdocs/9drive/frontend/vite.config.ts) | Rebranded VitePWA metadata details |
| | [`auth.ts`](file:///c:/xampp/htdocs/9drive/frontend/src/lib/auth.ts) | Changed session storage key prefix |
| **Frontend Pages** | [`LoginPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/LoginPage.tsx) | Updated login subtitle |
| | [`RegisterPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/RegisterPage.tsx) | Updated setup description and headers |
| | [`SettingsPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/SettingsPage.tsx) | Updated descriptions, warning messages, and modals |
| | [`QuotaTrackerPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/QuotaTrackerPage.tsx) | Updated popups and warnings |
| | [`AllFilesPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/AllFilesPage.tsx) | Updated view mode local storage key and dispatchers |
| | [`PublicFilePage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/PublicFilePage.tsx) | Updated shared page document titles |
| | [`GoogleConnectedPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/GoogleConnectedPage.tsx) | Updated duplicate link warning message |
| | [`GoogleAuthPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/GoogleAuthPage.tsx) | Updated duplicate auth warning message |
| **Legal Pages** | [`PrivacyPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/PrivacyPage.tsx) | Updated policy definitions, copyright, and folder names |
| | [`TermsPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/TermsPage.tsx) | Updated terms details, folder names, and disclaimer text |
| | [`DataDeletionPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/DataDeletionPage.tsx) | Updated steps, link text, support email, and copyright |
| | [`SecurityPrivacyPage.tsx`](file:///c:/xampp/htdocs/9drive/frontend/src/pages/SecurityPrivacyPage.tsx) | Updated policy summaries and warnings |
| **PWA Assets** | [`pwa-512x512.svg`](file:///c:/xampp/htdocs/9drive/frontend/public/pwa-512x512.svg) | Updated SVG accessibility labels |
| | [`pwa-192x192.svg`](file:///c:/xampp/htdocs/9drive/frontend/public/pwa-192x192.svg) | Updated SVG accessibility labels |
| | [`maskable-icon.svg`](file:///c:/xampp/htdocs/9drive/frontend/public/maskable-icon.svg) | Updated SVG accessibility labels |
| **Documentation** | `README.md` | Fully updated setup guides, titles, features, and notes |
| | `docs/*.md` | Updated all markdown files under `docs/` |

---

## 3. Brand Names Intentionally Kept for Technical Compatibility
- **Database Connection String**: The local MySQL schema/database name remains `9drive` to keep local host settings compatible with environment credentials.
- **Prisma Schema Tables/Columns**: Table schemas and field names (e.g. `providerAccountId`) are preserved to prevent runtime database lookup exceptions.
- **GitHub Repository URLs**: The fetch/link URLs `https://github.com/zenhosta/9drive` and `https://api.github.com/repos/zenhosta/9drive` are preserved to prevent broken page resources.
- **Prisma Migration History**: Historical schema migration files (under `backend/prisma/migrations/`) are left unchanged to ensure consistency of migration trails.

---

## 4. Build & Validation Results
1. **Backend Compilation**: `npm run build` compiled successfully without any TypeScript issues.
2. **Frontend Compilation**: `npm run build` (vite build + tsc) successfully created the production build.
3. **Security Test Verification**:
   - Running `npx tsx src/scripts/run-security-tests.ts` successfully executed:
     - Demo User logins on `@casanest.app` email domain.
     - Database-level global uniqueness verification on `providerAccountId`.
     - File, folder, and account access isolation checks.
     - Information disclosure verification.
     - **All 13 security hardening tests successfully PASSED.**

---

## 5. Final Verdict
**PASS**
