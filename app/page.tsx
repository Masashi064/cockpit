// app/page.tsx
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type GoalType = "north_star" | "mid_term" | "habit";
type TrackerType = "checkin" | "numeric" | null;

type Goal = {
  id: string;
  user_id: string | null;

  title: string;
  description: string | null;

  goal_type: GoalType;
  tracker_type: TrackerType;

  unit: string | null;
  target_value: number | null;
  target_date: string | null;

  is_pinned: boolean;
  is_hidden: boolean;
  sort_order: number;

  created_at: string;
  updated_at: string;
};

type GoalEntry = {
  id: string;
  goal_id: string;
  entry_date: string; // 'YYYY-MM-DD'
  is_done: boolean | null;
  value: number | null;
  reflection: string | null;
  created_at: string;
};

function formatGoalType(type: GoalType): string {
  switch (type) {
    case "north_star":
      return "North Star Goal";
    case "mid_term":
      return "Mid-term Goal";
    case "habit":
      return "Daily Habit";
    default:
      return type;
  }
}

function formatTrackerType(trackerType: TrackerType, unit: string | null): string {
  if (!trackerType) return "Tracker: Not set";
  if (trackerType === "checkin") return "Tracker: Check-in";
  if (trackerType === "numeric") {
    return unit ? `Tracker: Numeric (${unit})` : "Tracker: Numeric";
  }
  return "Tracker: Not set";
}

function formatLatestSummary(
  trackerType: TrackerType,
  entry: GoalEntry | undefined,
  unit: string | null
): string {
  if (!entry) return "No entries yet";

  const dateLabel = new Date(entry.entry_date).toLocaleDateString("en-GB");

  if (trackerType === "checkin") {
    if (entry.is_done === true) {
      return `Last check-in: Done (${dateLabel})`;
    }
    if (entry.is_done === false) {
      return `Last check-in: Not done (${dateLabel})`;
    }
    return `Last check-in: Logged (${dateLabel})`;
  }

  if (trackerType === "numeric") {
    if (entry.value === null) {
      return `Last entry: ${dateLabel}`;
    }
    const valueText = unit ? `${entry.value} ${unit}` : `${entry.value}`;
    return `Last entry: ${valueText} (${dateLabel})`;
  }

  return `Last update: ${dateLabel}`;
}

// ---- Dashboard データ取得 ----
async function getDashboardData() {
  // 1) ゴール一覧
  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("*")
    .eq("is_hidden", false)
    .order("is_pinned", { ascending: false })
    .order("sort_order", { ascending: true });

  if (goalsError) {
    console.error("[dashboard] goals error", goalsError);
    return {
      goals: [] as Goal[],
      latestEntriesByGoal: new Map<string, GoalEntry>(),
      entriesByGoal: new Map<string, GoalEntry[]>(),
    };
  }

  const typedGoals = (goals ?? []) as Goal[];

  if (typedGoals.length === 0) {
    return {
      goals: [],
      latestEntriesByGoal: new Map<string, GoalEntry>(),
      entriesByGoal: new Map<string, GoalEntry[]>(),
    };
  }

  // 2) ゴールごとのエントリ（カレンダー／グラフ用に全件取得）
  const goalIds = typedGoals.map((g) => g.id);

  const { data: entries, error: entriesError } = await supabase
    .from("goal_entries")
    .select("*")
    .in("goal_id", goalIds)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });

  const latestEntriesByGoal = new Map<string, GoalEntry>();
  const entriesByGoal = new Map<string, GoalEntry[]>();

  if (entriesError) {
    console.error("[dashboard] entries error", entriesError);
    return { goals: typedGoals, latestEntriesByGoal, entriesByGoal };
  }

  (entries as GoalEntry[] | null)?.forEach((entry) => {
    // entriesByGoal
    const arr = entriesByGoal.get(entry.goal_id) ?? [];
    arr.push(entry);
    entriesByGoal.set(entry.goal_id, arr);
  });

  // 最新エントリマップ
  (entries as GoalEntry[] | null)
    ?.slice()
    .sort((a, b) => {
      if (a.entry_date === b.entry_date) {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      return (
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
      );
    })
    .forEach((entry) => {
      if (!latestEntriesByGoal.has(entry.goal_id)) {
        latestEntriesByGoal.set(entry.goal_id, entry);
      }
    });

  return { goals: typedGoals, latestEntriesByGoal, entriesByGoal };
}

// ---- カレンダー（Check-in） ----
function renderCheckinCalendar(entries: GoalEntry[]) {
  if (!entries.length) return null;

  const doneDates = new Set<string>();
  entries.forEach((e) => {
    if (e.is_done) {
      doneDates.add(e.entry_date);
    }
  });

  if (doneDates.size === 0) return null;

  const baseDate = new Date();
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // 0-11

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay(); // 0: Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = baseDate.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
  });

  const todayISO = new Date().toISOString().slice(0, 10);
  const weekLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-medium">{monthLabel}</span>
        <span>Done days</span>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-slate-500">
        {weekLabels.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} className="h-6" />;

          const mm = String(month + 1).padStart(2, "0");
          const dd = String(day).padStart(2, "0");
          const dateKey = `${year}-${mm}-${dd}`;

          const isDone = doneDates.has(dateKey);
          const isToday = dateKey === todayISO;

          let className =
            "flex h-6 items-center justify-center rounded-lg border text-[10px]";

          if (isDone) {
            className +=
              " border-emerald-400 bg-emerald-500/80 text-slate-950 font-semibold";
          } else if (isToday) {
            className +=
              " border-emerald-400 text-emerald-200 bg-slate-950 font-semibold";
          } else {
            className += " border-slate-800 bg-slate-950 text-slate-300";
          }

          return (
            <div key={idx} className={className}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- グラフ（Numeric） ----
function renderNumericChart(
  entries: GoalEntry[],
  unit: string | null,
  targetValue: number | null
) {
  const numericEntries = entries.filter((e) => e.value !== null);
  if (!numericEntries.length) return null;

  const values = numericEntries.map((e) => e.value as number);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const hasTarget =
    typeof targetValue === "number" && !Number.isNaN(targetValue);

  // スケールは「データ＋ターゲット値」がすべて入るように調整
  let scaleMin = minVal;
  let scaleMax = maxVal;
  if (hasTarget) {
    scaleMin = Math.min(scaleMin, targetValue as number);
    scaleMax = Math.max(scaleMax, targetValue as number);
  }
  const range = scaleMax - scaleMin || 1;

  const width = 320;
  const height = 120;
  const paddingX = 16;
  const paddingY = 12;

  const stepX =
    numericEntries.length > 1
      ? (width - paddingX * 2) / (numericEntries.length - 1)
      : 0;

  const points = numericEntries.map((entry, idx) => {
    const x = paddingX + idx * stepX;
    const y =
      height -
      paddingY -
      (((entry.value as number) - scaleMin) / range) *
        (height - paddingY * 2);
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // ターゲットラインの Y 座標
  const targetY =
    hasTarget && range > 0
      ? height -
        paddingY -
        (((targetValue as number) - scaleMin) / range) *
          (height - paddingY * 2)
      : null;

  return (
    <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          Min: {minVal}
          {unit ? ` ${unit}` : ""}
        </span>
        <span>
          Max: {maxVal}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      {hasTarget && (
        <div className="mb-1 text-right text-[11px] text-emerald-300">
          Target: {targetValue}
          {unit ? ` ${unit}` : ""}
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-24 w-full rounded-md border border-slate-900 bg-slate-950"
      >
        {/* ガイドライン（上下） */}
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="#1f2933"
          strokeWidth={1}
        />
        <line
          x1={paddingX}
          y1={paddingY}
          x2={width - paddingX}
          y2={paddingY}
          stroke="#1f2933"
          strokeWidth={1}
        />

        {/* ターゲットライン */}
        {hasTarget && targetY !== null && targetY >= paddingY && targetY <= height - paddingY && (
          <line
            x1={paddingX}
            y1={targetY}
            x2={width - paddingX}
            y2={targetY}
            stroke="#facc15"          // 少し目立つ黄色系
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}

        {/* 折れ線 */}
        <polyline
          fill="none"
          stroke="#34d399"
          strokeWidth={2}
          points={polylinePoints}
        />

        {/* 点 */}
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r={3} fill="#34d399" />
        ))}
      </svg>
    </div>
  );
}


export default async function DashboardPage() {
  const { goals, latestEntriesByGoal, entriesByGoal } = await getDashboardData();

  const pinnedGoals = goals.filter((g) => g.is_pinned);
  const otherGoals = goals.filter((g) => !g.is_pinned);

  const renderGoalCard = (goal: Goal, isPinned: boolean) => {
    const latest = latestEntriesByGoal.get(goal.id);
    const entries = entriesByGoal.get(goal.id) ?? [];

    return (
      <Link
        key={goal.id}
        href={`/goals/${goal.id}`}
        className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-600 hover:bg-slate-900"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              {/* Title & badges */}
              <div className="flex flex-wrap items-center gap-2">
                {goal.is_pinned && (
                  <span className="inline-flex items-center rounded-full border border-emerald-400 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-200">
                    Pinned
                  </span>
                )}
                <h2 className="text-base font-semibold text-slate-50">
                  {goal.title}
                </h2>
              </div>

              {/* Description */}
              {goal.description && (
                <p className="text-sm text-slate-300 line-clamp-2">
                  {goal.description}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5">
                  {formatGoalType(goal.goal_type)}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5">
                  {formatTrackerType(goal.tracker_type, goal.unit)}
                </span>
                {goal.target_value !== null && (
                  <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5">
                    Target: {goal.target_value}
                    {goal.unit ? ` ${goal.unit}` : ""}
                  </span>
                )}
                {goal.target_date && (
                  <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5">
                    Until{" "}
                    {new Date(goal.target_date).toLocaleDateString("en-GB")}
                  </span>
                )}
              </div>

              {/* Latest summary */}
              <p className="text-xs text-slate-400">
                {formatLatestSummary(goal.tracker_type, latest, goal.unit)}
              </p>
            </div>

            {/* Right side */}
            <div className="flex flex-col items-end justify-between text-xs text-slate-500">
              <span>
                Updated:{" "}
                {new Date(goal.updated_at).toLocaleDateString("en-GB")}
              </span>
              <span className="mt-2 text-slate-400">Open &gt;</span>
            </div>
          </div>

          {/* ビジュアル（Pinned goal のみ） */}
          {isPinned && goal.tracker_type === "checkin" && renderCheckinCalendar(entries)}
          {isPinned &&
            goal.tracker_type === "numeric" &&
            renderNumericChart(entries, goal.unit, goal.target_value)}
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Your cockpit for goals and daily progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/goals"
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:border-slate-500 hover:bg-slate-900"
          >
            View all goals
          </Link>
          <Link
            href="/goals/new"
            className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            + New goal
          </Link>
        </div>
      </header>

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-100">
            You don&apos;t have any goals yet.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Start by creating a North Star Goal, a Mid-term Goal, or a Daily Habit.
          </p>
          <div className="mt-4">
            <Link
              href="/goals/new"
              className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Create your first goal
            </Link>
          </div>
        </div>
      )}

      {/* Pinned goals with visuals */}
      {pinnedGoals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Pinned goals
            </h2>
          </div>
          <div className="space-y-3">
            {pinnedGoals.map((goal) => renderGoalCard(goal, true))}
          </div>
        </section>
      )}

      {/* Other goals (compact) */}
      {otherGoals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Other goals
            </h2>
          </div>
          <div className="space-y-3">
            {otherGoals.map((goal) => renderGoalCard(goal, false))}
          </div>
        </section>
      )}
    </div>
  );
}
