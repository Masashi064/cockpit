// app/goals/page.tsx
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type GoalType = "north_star" | "mid_term" | "habit";
type TrackerType = "checkin" | "numeric";

type Goal = {
  id: string;
  user_id: string;

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

async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("is_hidden", false)
    .order("is_pinned", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getGoals] error", error);
    return [];
  }

  return data ?? [];
}

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
  switch (trackerType) {
    case "checkin":
      return "Check-in";
    case "numeric":
      return unit ? `Numeric (${unit})` : "Numeric";
    default:
      return trackerType;
  }
}

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Goals
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your North Star Goals, Mid-term Goals, and Daily Habits.
          </p>
        </div>

        <Link
          href="/goals/new"
          className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          + New Goal
        </Link>
      </header>

      {/* Body */}
      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-100">
            You don&apos;t have any goals yet.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Start by creating your first goal – for example a North Star Goal or a Daily Habit.
          </p>
          <div className="mt-4">
            <Link
              href="/goals/new"
              className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Create a goal
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <Link
              key={goal.id}
              href={`/goals/${goal.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-600 hover:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Title & badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {goal.is_pinned && (
                      <span className="inline-flex items-center rounded-full border border-amber-400 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
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
                </div>

                {/* Right side info */}
                <div className="flex flex-col items-end justify-between text-xs text-slate-500">
                  <span>
                    Created:{" "}
                    {new Date(goal.created_at).toLocaleDateString("en-GB")}
                  </span>
                  <span className="mt-2 text-slate-400">View &gt;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
