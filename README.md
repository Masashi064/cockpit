# Cockpit

Cockpit is a self-management web app that works like a personal flight deck:

- Set goals (from big “North Star” goals down to daily habits)
- Track your progress with simple inputs
- See your progress on a dashboard (cards + charts)
- Write reflections and quick notes in a memo space

Built with **Next.js + Supabase** and a dark, minimal UI.

---

## Features

### 🧭 Goals

Three types of goals:

- **North Star Goal**  
  - Big, long-term direction (e.g. “Be able to work fully remote by 2030”)
  - Shown prominently but not tracked daily (no input required)

- **Mid-term Goal**  
  - Measurable goals (e.g. “Reach 68 kg”, “Do 200 English lessons”)
  - Usually tracked with numbers over weeks/months

- **Daily Habit**  
  - Everyday actions (e.g. “Take English lesson”, “Go for a walk”)
  - Suited for check-in style tracking

### 📊 Tracker types

Each goal can choose how it is tracked:

- **Not set yet**
  - Just keep the goal as text, no tracker
- **Check-in (Done / Not done)**
  - Press a button when you did it today
  - History tab shows daily log
- **Numeric (value input)**
  - Input a number with optional unit  
    (e.g. `76.5 kg`, `45 min`, `3 lessons`)
  - You can also set:
    - **Target value** (e.g. `68 kg`)
    - **Target date** (optional)

### 🏠 Dashboard (`/`)

The dashboard is your “cockpit”:

- Shows all active goals as cards
- **Pinned goals** appear at the top
- For each goal card:
  - Goal type, tracker type
  - Target value / target date (if set)
  - Latest entry summary

Pinned goals also get visuals:

- **Pinned Check-in goals**
  - Small calendar for the current month
  - Days you marked as done are highlighted

- **Pinned Numeric goals**
  - Mini line chart of recent values
  - **Target line** is drawn horizontally at the goal value  
    (e.g. `68 kg` line across the chart)

Click a card to open `/goals/[id]` and focus on input + history.

### 🎯 Goal pages

- `/goals` — list of all goals
  - Filtered into pinned vs other goals
  - Links to each goal detail
- `/goals/new` — create goal
  - Title, description
  - Goal type (North Star / Mid-term / Daily Habit)
  - Tracker type (Not set yet / Check-in / Numeric)
  - Numeric settings (unit, target value, target date)
  - “Pin this goal” (default: ON)
- `/goals/[id]/edit` — edit goal settings
- `/goals/[id]` — focus on this goal
  - Add entries:
    - Check-in: mark today as done + optional reflection
    - Numeric: value + date + optional reflection
  - History list (latest first)
  - Each history row has a 🗑 button to delete an entry

### 📝 Memo workspace (`/memo`)

A lightweight personal memo space:

- Multiple “topics” (left sidebar)
- Rich text / checklist-style notes per topic
- Data storage:
  - If **logged in** → data is stored in Supabase (`memo_documents` table)
  - If **not logged in** → data is saved in `localStorage` on the browser
- Accessible from:
  - Header 3-dot menu → **“Open memo”**

---

## Tech stack

- **Framework**: Next.js (App Router, React, TypeScript)
- **Styling**: Tailwind CSS + custom dark theme
- **Backend**: Supabase (Postgres + Auth)
- **Auth**: Supabase Auth (email/password or other providers)
- **State**: React hooks

---

## Getting started

### 1. Prerequisites

- Node.js (LTS)
- npm / pnpm / yarn
- Supabase project

### 2. Clone & install

```bash
git clone <your-repo-url> cockpit
cd cockpit
npm install
# or: pnpm install / yarn

3. Environment variables

Create .env.local in the project root:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key


(If you later add server-side Supabase logic, you can also keep
SUPABASE_SERVICE_ROLE_KEY for local scripts, but it is NOT required for the current UI.)

4. Database schema (Supabase)

Run something like the following SQL in Supabase:

goals table
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),

  title text not null,
  description text,

  goal_type text not null check (goal_type in ('north_star', 'mid_term', 'habit')),
  tracker_type text check (tracker_type in ('checkin', 'numeric')),

  unit text,
  target_value numeric,
  target_date date,

  is_pinned boolean not null default true,
  is_hidden boolean not null default false,
  sort_order integer not null default 1000,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_id_idx on public.goals (user_id);

goal_entries table
create table public.goal_entries (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,

  entry_date date not null,
  is_done boolean,
  value numeric,
  reflection text,

  created_at timestamptz not null default now()
);

create index goal_entries_goal_id_idx on public.goal_entries (goal_id);
create index goal_entries_entry_date_idx on public.goal_entries (entry_date);

memo_documents table
create table public.memo_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id)
);


Recommended: enable RLS and add policies
user_id = auth.uid() for select, insert, update, delete.

Scripts
npm run dev     # start dev server
npm run build   # production build
npm run start   # start production server (after build)
npm run lint    # lint code

Roadmap / Ideas

Streaks & statistics per goal (best streak, current streak)

Weekly / monthly summary cards

Tags / focus areas for grouping goals

Export / import data (JSON)

More keyboard shortcuts and mobile tweaks

Optional notifications / reminders

License

Personal project.
Feel free to read the code and get ideas, but please ask before using this as a commercial template.