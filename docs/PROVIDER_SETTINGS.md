# Provider Settings Configuration Guide

This guide explains how to configure Google OAuth and Google Recaptcha settings dynamically inside CasaNest, instead of modifying environment files manually.

---

## 1. Initial Setup Mode (Bootstrap)

When CasaNest starts with an empty database (zero admin users), the application automatically enters **Initial Setup Mode**:
- **Setup UI:** The registration page is replaced with an **Initial Setup** form. This form collects the initial administrator profile details (Name, Email, Password) alongside the global Google OAuth details (Client ID, Client Secret, and Redirect URI).
- **Setup API:** The frontend submits setup details to `POST /auth/bootstrap`. The backend creates the first user with the `admin` role and saves the Google OAuth configs into the database.
- **Safety Lockout:** Once the first administrator is successfully registered, the bootstrap mode is disabled. Further requests to `POST /auth/bootstrap` will instantly reject with a `403 Forbidden` error, and normal visitors will only see the standard user registration page.

---

## 2. Environment Configuration (`backend/.env`)

The following critical system parameters must remain in your backend `.env` file to boot the server:

- **`DATABASE_URL`**: MySQL database connection string.
- **`APP_PORT`**: Port number for the Express server (defaults to `4000`).
- **`FRONTEND_URL`**: URL pointing to the React frontend (used for CORS and redirect resolution).
- **`JWT_ACCESS_SECRET`**: Signature secret for app login session tokens.
- **`TOKEN_ENCRYPTION_KEY`**: Key used to encrypt tokens and credentials before saving them to the database.
- **`ACCESS_TOKEN_TTL_SECONDS`** and **`REFRESH_TOKEN_TTL_DAYS`**: Token expiry windows.

---

## 3. Dynamic Provider Configs (Managed via UI)

The following configurations can be entered directly from the application's frontend settings dashboard:

### A. Google Drive OAuth
- **Google Client ID**: Obtained from your Google Cloud Console.
- **Google Client Secret**: Obtained from your Google Cloud Console.
- **Redirect URI**: Must match the Authorized Redirect URI in Google Cloud Console.
- **Enable Checkbox**: Toggles whether users are allowed to sign in with Google or connect Google Drive accounts.

### B. Google Recaptcha (Disabled)
> [!NOTE]
> Google reCAPTCHA settings are currently disabled and hidden from the UI. The application does not require captcha verification for user registration by default.

---

## 4. Step-by-Step Google OAuth Integration Setup

1. **Open Google Cloud Console:**
   Go to [https://console.cloud.google.com/](https://console.cloud.google.com/).
2. **Enable Drive API:**
   Navigate to **APIs & Services > Library**, search for **Google Drive API**, and click **Enable**.
3. **Configure consent screen:**
   Go to **APIs & Services > OAuth consent screen**. Set up app name and developer email, and add the following scopes:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
4. **Create Web OAuth Client:**
   Go to **APIs & Services > Credentials**. Click **Create Credentials > OAuth client ID** and choose **Web application**.
   - **Authorized JavaScript Origin:** `http://localhost:5173` (your frontend URL)
   - **Authorized Redirect URI:** `http://localhost:4000/connected-accounts/google/callback` (your backend OAuth callback URL)
5. **Copy Credentials:**
   Copy the generated **Client ID** and **Client Secret**.
6. **Save to CasaNest Settings:**
   - Log in to your CasaNest dashboard (the first registered account automatically receives the **Admin** role).
   - Go to **Settings**.
   - Fill the **Google Drive OAuth** form.
   - Click **Test Connection** to verify connection, and click **Save Settings** to persist the configuration.

---

## 5. Security of Secrets

1. **No Frontend Exposure:**
   Client Secrets and Recaptcha Secret Keys are never returned in plaintext by the backend GET endpoints. Instead, the backend returns a status flag (e.g. `clientSecretConfigured: true`) indicating if the secret has been set.
2. **Database Encryption:**
   All sensitive parameters are encrypted using AES-256-CBC via the app's `TOKEN_ENCRYPTION_KEY` before write operations to the database `provider_configs` table.
3. **Protected Admin Router:**
   All PUT/GET settings routes are protected by the `requireAdmin` middleware, meaning only registered users with an `'admin'` role can read, write, or test credentials.

---

## 6. reCAPTCHA Status (Disabled)

CasaNest does not use reCAPTCHA for now. The reCAPTCHA settings cards are removed from the Settings dashboard, and verification is bypassed.
- **Frontend Bypass:** Since `VITE_RECAPTCHA_SITE_KEY` is empty by default and hidden from settings, the registration form does not load or render the captcha widget.
- **Backend Bypass:** The backend automatically skips token verification when no active reCAPTCHA configuration is found or if the environment variable `RECAPTCHA_SECRET_KEY` is empty.

