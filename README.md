# 💰 ExpenseTrack — Production Personal Expense Tracker

A modern, responsive, and secure personal finance and expense tracking web application built with **Next.js App Router**, **React**, **TypeScript**, **Tailwind CSS**, and **Supabase** (PostgreSQL + Auth + Row Level Security).

Designed with a clean, high-performance financial SaaS dashboard aesthetic inspired by modern enterprise web applications. Supports multi-currency preferences with **Bangladeshi Taka (৳ BDT)** as default.

---

## ✨ Features & Architecture

### 1. 🔐 Authentication & Session Security
- User registration, login, logout, password reset, and recovery flows.
- Powered by `@supabase/ssr` with secure HTTP-only cookies in Next.js Server Components, Server Actions, and Middleware.
- Protected route middleware guards private pages (`/dashboard`, `/transactions`, `/categories`, `/budgets`, `/reports`, `/settings`).
- Automatic user profile provisioning with default settings and seeded categories.

### 2. 📊 Financial Dashboard
- High-level metrics: **Total Income**, **Total Expenses**, **Current Net Balance**, and **Savings Rate (%)**.
- Dynamic date-range filtering: *This Month*, *Last Month*, *Last 30 Days*, *This Year*, and *All Time*.
- Interactive charts powered by **Recharts**:
  - Cashflow Comparison (Bar chart comparing income vs expenses).
  - Spending by Category (Interactive Donut chart with custom color palettes).
- Recent transactions ledger with quick status badges and amount indicators.
- Quick action triggers: *+ Add Income* and *+ Add Expense*.
- Summaries calculated dynamically from PostgreSQL database records.

### 3. 💳 Transactions Ledger
- Full CRUD operations: Add, edit, view details, and permanently delete transactions.
- Fields: Title, amount (`NUMERIC(14,2)` precision to prevent floating-point rounding errors), transaction type (*income* / *expense*), category, date, payment method (Cash, Bank Transfer, Credit Card, Debit Card, bKash, Nagad, Rocket, Upay, Other), and optional notes.
- Instant search by title or notes.
- Multi-dimensional filters: Type, Category, and Date range.
- Pagination controls with custom page sizes.
- Accessible modal confirmation before deleting records.
- One-click CSV export of the filtered transaction ledger.

### 4. 🏷️ Categories Management
- Pre-seeded default categories:
  - **Expense**: Food & Dining, Transport, Shopping, Bills & Utilities, Education, Healthcare, Entertainment, Housing & Rent, Other Expense.
  - **Income**: Salary, Freelance, Business, Investments, Other Income.
  - Automatic category seeder trigger on new user signups.
- Custom categories: Create custom income or expense categories with color palette pickers and Lucide icons.
- Category editing and deletion with foreign-key integrity protection.

### 5. 🎯 Monthly Budgets & Overrun Alerts
- Set monthly spending limits per expense category for any target month (YYYY-MM).
- Real-time tracking of amount spent against the allocated limit.
- Color-coded progress indicators:
  - 🟢 **Healthy** (<80% used)
  - 🟡 **Warning** (80% - 99% used)
  - 🔴 **Exceeded** (≥100% used)
- Banner alerts when any category approaches or breaches its budget ceiling.

### 6. 📈 Reports & Analytics
- Monthly and annual earnings vs expense summaries.
- Trajectory of savings over time via interactive Recharts area charts.
- Detailed expense and income distribution tables showing percentage share and transaction volume.
- CSV data exports:
  - **Financial Summary CSV** (Category allocations, transaction counts, and share percentages).
  - **Transaction Ledger CSV** (Detailed line-item records).

### 7. ⚙️ User Preferences & Settings
- Display name and account information.
- Currency selection: **Bangladeshi Taka (৳ BDT)** as default, with USD ($), EUR (€), GBP (£), INR (₹), CAD (CA$), AUD (AU$), JPY (¥), AED, SAR.
- Date formatting: `DD/MM/YYYY`, `MM/DD/YYYY`, or `YYYY-MM-DD`.
- Password change and security controls.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend & Database**: [Supabase PostgreSQL](https://supabase.com/)
- **Auth**: Supabase Auth + `@supabase/ssr`
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Formatting & Validation**: Custom financial utils + Zod

---

## 📁 Project Structure

```text
personal_expence_tracker/
├── app/
│   ├── auth/callback/route.ts  # Supabase Auth code exchange handler
│   ├── budgets/page.tsx        # Monthly budgeting and progress tracking
│   ├── categories/page.tsx     # Categories management (expense & income)
│   ├── dashboard/page.tsx      # Main dashboard with analytics and cards
│   ├── forgot-password/page.tsx# Password reset request
│   ├── login/page.tsx          # Login page
│   ├── register/page.tsx       # Signup & email confirmation
│   ├── reports/page.tsx        # Reports, trend charts, and CSV exports
│   ├── reset-password/page.tsx # Password change form
│   ├── settings/page.tsx       # User profile and currency settings
│   ├── transactions/page.tsx   # Transaction ledger with search & filters
│   ├── globals.css             # Tailwind CSS tokens
│   ├── layout.tsx              # Root layout with AuthProvider & fonts
│   └── page.tsx                # SaaS landing page
├── components/
│   ├── budgets/BudgetModal.tsx # Set/edit budget modal
│   ├── categories/CategoryModal.tsx # Add/edit category modal
│   ├── dashboard/
│   │   ├── DashboardCharts.tsx # Recharts cashflow and pie charts
│   │   ├── RecentTransactions.tsx # Recent transaction table
│   │   └── StatCards.tsx       # Balance, income, expense, savings cards
│   ├── layout/
│   │   ├── DashboardLayout.tsx # Shell with responsive sidebar & header
│   │   ├── Header.tsx          # Top bar with quick actions & user info
│   │   └── Sidebar.tsx         # Desktop sidebar and mobile drawer
│   ├── providers/AuthProvider.tsx # Client-side auth context and session hooks
│   ├── transactions/TransactionFormModal.tsx # Add/edit transaction modal
│   └── ui/
│       ├── Alert.tsx           # Banner alerts
│       ├── CategoryIcon.tsx    # Dynamic Lucide icon and color resolver
│       ├── Modal.tsx           # Accessible modal container
│       └── Skeleton.tsx        # Skeletons for cards, tables, and charts
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client (createBrowserClient)
│   │   ├── middleware.ts       # Session refresher and route protection
│   │   └── server.ts           # Server client (createServerClient)
│   └── utils.ts                # Currency format, date formatting, CSV export
├── middleware.ts               # Next.js middleware router
├── supabase/
│   └── schema.sql              # PostgreSQL schema, RLS policies, and triggers
├── types/
│   └── database.ts             # Complete TypeScript database types
├── .env.example                # Example environment variables
└── README.md                   # Documentation & deployment guide
```

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New Project**.
3. Choose an organization, enter a **Project Name** (e.g., `personal-expense-tracker`), choose a secure **Database Password**, and select a region close to your users.
4. Click **Create new project** and wait 1-2 minutes for provisioning.

### Step 2: Apply the Database Schema & RLS

1. In your Supabase Project Dashboard, navigate to the **SQL Editor** tab (left navigation menu).
2. Click **New query**.
3. Open the file `supabase/schema.sql` from this repository.
4. Copy the entire contents and paste them into the SQL Editor.
5. Click **Run** (or `Cmd+Enter` / `Ctrl+Enter`).
6. You will see:
   - `profiles`, `categories`, `transactions`, and `budgets` tables created.
   - Indexes for query optimization added.
   - Row Level Security (RLS) enabled on all tables with owner-only access rules.
   - Triggers for automatic timestamps (`updated_at`).
   - Trigger `on_auth_user_created` that creates user profiles and automatically seeds standard expense and income categories.

### Step 3: Configure Authentication Settings in Supabase

1. In your Supabase Dashboard, go to **Authentication** -> **URL Configuration**.
2. Under **Site URL**, set:
   - Local development: `http://localhost:3000`
   - Production (e.g. Vercel): `https://your-app-domain.vercel.app`
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`
   - `https://your-app-domain.vercel.app/auth/callback`
   - `https://your-app-domain.vercel.app/reset-password`
4. (Optional) In **Authentication** -> **Providers** -> **Email**:
   - For rapid local testing without waiting for email confirmations, you can uncheck **Confirm email** if desired.

### Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. In Supabase, go to **Project Settings** -> **API**.
3. Copy **Project URL** and paste it as `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy **anon public** key and paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Your `.env.local` file should look like:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 💻 Development & Build Commands

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Type Check & Build for Production
```bash
npm run build
```

### Run Production Server Locally
```bash
npm run start
```

### Run ESLint
```bash
npm run lint
```

---

## 🔒 Security & Database Row Level Security (RLS)

- **Row Level Security**: Every table enforces RLS. No user can view, insert, update, or delete records belonging to another user.
- **Relational Integrity**: Foreign key constraints with `ON DELETE CASCADE` ensure that deleting a user or category cleanly handles related records.
- **Zero Client Trust**: All mutations in Supabase validate `auth.uid() = user_id`.
- **API Key Separation**: Only the `anon` public key is exposed via `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Any administrative service role keys remain strictly server-side.

---

## 🚢 Deploying to Production (Vercel & GitHub)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "feat: complete personal expense tracker with Next.js and Supabase"
git branch -M main
git remote add origin https://github.com/your-username/personal-expense-tracker.git
git push -u origin main
```

*(Note: `.env.local` and all private secrets are automatically excluded by `.gitignore`.)*

### 2. Deploy to Vercel

1. Log in to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
2. Import your GitHub repository `personal-expense-tracker`.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase Anon Public Key
4. Click **Deploy**.
5. Once deployed, add your Vercel production URL (e.g., `https://your-app.vercel.app/auth/callback`) to Supabase Auth -> URL Configuration -> Redirect URLs.

---

## 📄 License
MIT License. Built for personal finance management and open-source learning.
