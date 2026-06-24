# Database Setup & Import Guide

This directory contains the manual MySQL/MariaDB database setup file (`setup.sql`) for **CasaNest**. 

---

## ⚠️ Important Note on Prisma Migrations

This project is built using **Prisma ORM**. 
- **Manual SQL Import is Optional:** If you are setting up the project locally with Node.js installed, you can simply run `npm run prisma:migrate` from the `backend/` directory. Prisma will automatically create the `9drive` database (used by CasaNest) and apply all migrations.
- **When to use Manual SQL Import:** Use `setup.sql` if you are setting up the database on a server using **phpMyAdmin**, **XAMPP MySQL**, or if you prefer to seed the database structure manually without running Prisma CLI commands.

*Note: If you import the database manually and intend to run Prisma migrations later, you may need to mark the existing migrations as applied using `npx prisma migrate resolve --applied <migration_name>` to avoid conflict errors, or simply run the backend directly without running development migrations.*

---

## 1. Importing `setup.sql`

### Option A: Using phpMyAdmin (XAMPP / Web-based)
1. Open your browser and navigate to **phpMyAdmin** (usually `http://localhost/phpmyadmin` or `http://127.0.0.1/phpmyadmin`).
2. Click on the **Import** tab in the top navigation bar.
   * *Note: You do not need to create the database beforehand, as `setup.sql` includes the `CREATE DATABASE IF NOT EXISTS 9drive` statement.*
3. Click **Browse...** or **Choose File** and select the [setup.sql](file:///c:/xampp/htdocs/9drive/backend/database/setup.sql) file.
4. Keep the character set as `utf-8` and format as `SQL`.
5. Click **Import** (or **Go**) at the bottom of the page.
6. Once the execution completes, you will see a success message and the `9drive` database with its 17 tables in the left sidebar.

### Option B: Using the Terminal (MySQL CLI)
Run the following command in your terminal to import the script directly. Replace `root` with your MySQL username (you will be prompted for a password if one is set):

```bash
# If you don't have a password set (default for XAMPP):
mysql -u root < backend/database/setup.sql

# If you have a password set:
mysql -u root -p < backend/database/setup.sql
```

---

## 2. Configuring `backend/.env`

Create a file named `.env` inside the `backend/` directory if you haven't already. Populate the `DATABASE_URL` parameter to connect to your manual database (CasaNest uses `9drive` as the default database name for technical compatibility):

```env
# Database connection string format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="mysql://root@localhost:3306/9drive"

# App Port Configuration
APP_PORT=4000
FRONTEND_URL="http://localhost:5173"

# Secret Keys (Change these to secure values in production!)
JWT_ACCESS_SECRET="change-this-jwt-secret-at-least-32-chars"
TOKEN_ENCRYPTION_KEY="change-this-encryption-key-32bytes!"

# Upload Limits
MAX_UPLOAD_BYTES=5368709120
```

*Note: If your MySQL server is running on a different port (other than `3306`) or requires a password, adjust the connection URL accordingly (e.g. `mysql://user:pass@localhost:3306/9drive`).*

---

## 3. Running the Backend After Import

Once the database structure is imported and the `.env` file is configured, follow these steps to run the CasaNest backend:

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Generate the Prisma Client to match the database structure:
   ```bash
   npm run prisma:generate
   ```
4. Start the backend in development mode:
   ```bash
   npm run dev
   ```
   The backend dev server will start running at `http://localhost:4000`.
