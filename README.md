# Dashboard Template

A small opinionated template for building dashboard-style web apps
(Volatility Dashboard, FIRE simulators, NISA tools, etc.) with:

- Next.js (App Router)
- TypeScript
- Supabase Auth (Google OAuth)
- Reusable site header with login/logout + overflow menu

This repository is meant to be a **starting point** you can copy and
adapt for new side projects.

---

## 1. Features

- 🔐 **Login header**
  - Supabase Auth (Google OAuth)
  - Shows current user email and Logout button when authenticated
  - “Contact developer” link is hidden under a ⋯ (overflow) menu
- 🧱 **Simple layout**
  - `SiteHeader` at the top
  - Main content area with a max-width container
- 📝 **Self-documenting home page**
  - `app/page.tsx` explains how to reuse this template for future apps
  - Contains example links/cards you can replace for each new project

---

## 2. Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Auth / Backend**: [Supabase](https://supabase.com/)
- **Styling**: Tailwind-like utility classes (via global styles)

---

## 3. Getting Started (for this repo)

### Prerequisites

- Node.js (v18+ recommended)
- npm (or pnpm / yarn, if you prefer)
- A Supabase project (for login), if you want to use auth

### 3.1 Clone & install

```bash
git clone https://github.com/Masashi064/dashboard-template.git
cd dashboard-template

npm install

3.2 Environment variables

Create .env.local in the project root:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key


If you use Google OAuth, configure a Google provider in Supabase and set
the redirect URL to:

https://your-domain.com/auth/callback


For local development, it will be:

http://localhost:3000/auth/callback


(このあたりは将来の自分が忘れがちなので、Supabase の設定と合わせて確認すること)

3.3 Run dev server
npm run dev


Then open:

http://localhost:3000


You should see the dashboard template home page with the header at the top.

4. How to reuse this template for new apps

There are two main ways to reuse this dashboard template.

4.1 Use GitHub “Use this template”

Recommended for new, independent projects.

Open this repository on GitHub.

Click “Use this template” → “Create a new repository”.

Give it a new name, e.g. nisa-simulator, fire-dashboard, etc.

Clone that new repository locally and start editing.

This keeps Git history clean and separates each app.

4.2 Clone & change remote (alternative)

Alternatively:

git clone https://github.com/Masashi064/dashboard-template.git my-new-app
cd my-new-app


Then:

Remove the existing Git remote:

git remote remove origin


Create a new repository on GitHub (e.g. my-new-app)

Add it as the remote:

git remote add origin https://github.com/yourname/my-new-app.git
git push -u origin main


Now you have a new project with this template as the starting code.

5. Key Files
5.1 components/SiteHeader.tsx

Main site header

Shows:

Site title (linked to /)

Login / Logout button via Supabase Auth

User email when logged in

⋯ menu with “開発者へ連絡 (Contact developer)” link

You will typically edit:

The site title text

Links in the overflow menu

(Optionally) logo / branding

5.2 lib/supabaseClient.ts

Supabase client configuration using NEXT_PUBLIC_SUPABASE_URL and
NEXT_PUBLIC_SUPABASE_ANON_KEY.

Used by SiteHeader for authentication.

If you create a new Supabase project for each app, just update the
environment variables in .env.local.

5.3 app/page.tsx

Template for the top page of the app.

Includes:

Short description of the template

“How to use this template” notes (自分用メモ)

Example cards/links to other pages (alerts, docs, contact, etc.)

For a new app, you will typically:

Replace the explanation text with the new app’s concept

Replace example links/cards with your real pages

Remove any sections you don’t need

6. Typical customization steps (for future me)

When starting a new dashboard app from this template:

Rename the project

Change the repository name on GitHub

Optionally update package.json → "name": "your-new-app-name"

Update branding

Edit SiteHeader title (and logo if you add one)

Adjust colors / text to fit the new project

Configure Supabase

Create or choose a Supabase project

Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

Configure OAuth provider(s) (e.g. Google) and redirect URL

Create feature pages

Add new routes under app/ (e.g. app/alerts/page.tsx,
app/simulator/page.tsx, etc.)

Replace example links in app/page.tsx with your actual pages

Clean up

Delete unused sample pages or components

Update this README to describe the new app if it becomes “real”

7. License

This template is primarily for personal / side-project use, but feel free
to reuse and modify it as you like.

(If you later decide to make this public for others, you can add an
explicit OSS license here, e.g. MIT.)