// app/goals/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type GoalType = "north_star" | "mid_term" | "habit";
type DbTrackerType = "checkin" | "numeric" | null;
type UiTrackerType = "unset" | "checkin" | "numeric";

type Goal = {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;

  goal_type: GoalType;
  tracker_type: DbTrackerType;

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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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

function formatTrackerLabel(trackerType: UiTrackerType, unit: string | null): string {
  if (trackerType === "unset") return "Tracker: Not set";
  if (trackerType === "checkin") return "Tracker: Check-in (Done / Not done)";
  if (trackerType === "numeric") {
    return unit ? `Tracker: Numeric (${unit})` : "Tracker: Numeric";
  }
  return "Tracker: Not set";
}

function formatDateLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB");
}

export default function GoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params?.id as string | undefined;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [entries, setEntries] = useState<GoalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [savingEntry, setSavingEntry] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  // Check-in 用フォーム
  const [checkinReflection, setCheckinReflection] = useState("");

  // Numeric 用フォーム
  const [numericDate, setNumericDate] = useState(todayISO);
  const [numericValue, setNumericValue] = useState("");
  const [numericReflection, setNumericReflection] = useState("");

  useEffect(() => {
    if (!goalId) return;

    async function fetchGoalAndEntries() {
      setLoading(true);
      setLoadError(null);

      try {
        // Goal 本体
        const { data: goalData, error: goalError } = await supabase
          .from("goals")
          .select("*")
          .eq("id", goalId)
          .single();

        if (goalError || !goalData) {
          console.error("[goal detail] goal error", goalError);
          setLoadError("Failed to load this goal.");
          setLoading(false);
          return;
        }

        const g = goalData as Goal;
        setGoal(g);

        // Entries
        const { data: entriesData, error: entriesError } = await supabase
          .from("goal_entries")
          .select("*")
          .eq("goal_id", goalId)
          .order("entry_date", { ascending: true })
          .order("created_at", { ascending: true });

        if (entriesError) {
          console.error("[goal detail] entries error", entriesError);
          setEntries([]);
        } else {
          setEntries((entriesData ?? []) as GoalEntry[]);
        }

        setNumericDate(todayISO());
        setLoading(false);
      } catch (err) {
        console.error("[goal detail] unexpected error", err);
        setLoadError("Failed to load this goal.");
        setLoading(false);
      }
    }

    fetchGoalAndEntries();
  }, [goalId]);

  if (!goalId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-400">Invalid goal id.</p>
        <Link
          href="/goals"
          className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:border-slate-500 hover:bg-slate-900"
        >
          Back to goals
        </Link>
      </div>
    );
  }

  const uiTrackerType: UiTrackerType = useMemo(() => {
    if (!goal || !goal.tracker_type) return "unset";
    return goal.tracker_type;
  }, [goal]);

  const numericEntries = useMemo(
    () => entries.filter((e) => e.value !== null),
    [entries]
  );

  async function handleAddCheckin(e: FormEvent) {
    e.preventDefault();
    if (!goal) return;

    setSavingEntry(true);
    setEntryError(null);

    try {
      const { data, error } = await supabase
        .from("goal_entries")
        .insert({
          goal_id: goal.id,
          entry_date: todayISO(),
          is_done: true,
          value: null,
          reflection: checkinReflection.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error("[add checkin] error", error);
        setEntryError("Failed to save your check-in. Please try again.");
        setSavingEntry(false);
        return;
      }

      setEntries((prev) => [...prev, data as GoalEntry]);
      setCheckinReflection("");
      setSavingEntry(false);
    } catch (err) {
      console.error("[add checkin] unexpected", err);
      setEntryError("Something went wrong. Please try again.");
      setSavingEntry(false);
    }
  }

  async function handleAddNumeric(e: FormEvent) {
    e.preventDefault();
    if (!goal) return;

    if (!numericValue.trim()) {
      setEntryError("Value is required.");
      return;
    }

    const val = Number(numericValue);
    if (isNaN(val)) {
      setEntryError("Value must be a number.");
      return;
    }

    setSavingEntry(true);
    setEntryError(null);

    try {
      const { data, error } = await supabase
        .from("goal_entries")
        .insert({
          goal_id: goal.id,
          entry_date: numericDate || todayISO(),
          is_done: null,
          value: val,
          reflection: numericReflection.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error("[add numeric] error", error);
        setEntryError("Failed to save your entry. Please try again.");
        setSavingEntry(false);
        return;
      }

      setEntries((prev) => [...prev, data as GoalEntry]);
      setNumericValue("");
      setNumericReflection("");
      setSavingEntry(false);
    } catch (err) {
      console.error("[add numeric] unexpected", err);
      setEntryError("Something went wrong. Please try again.");
      setSavingEntry(false);
    }
  }

  async function handleDeleteEntry(entryId: string) {
  // 確認ダイアログ（誤タップ防止）
  if (typeof window !== "undefined") {
    const ok = window.confirm("Delete this entry?");
    if (!ok) return;
  }

  setDeletingEntryId(entryId);
  setEntryError(null);

  try {
    const { error } = await supabase
      .from("goal_entries")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error("[delete entry] error", error);
      setEntryError("Failed to delete this entry. Please try again.");
      setDeletingEntryId(null);
      return;
    }

    // ローカルの一覧からも削除
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    setDeletingEntryId(null);
  } catch (err) {
    console.error("[delete entry] unexpected", err);
    setEntryError("Something went wrong while deleting. Please try again.");
    setDeletingEntryId(null);
  }
}


  function renderNumericChart() {
    if (numericEntries.length === 0) return null;

    const values = numericEntries.map((e) => e.value as number);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

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
        ((entry.value as number - minVal) / range) * (height - paddingY * 2);
      return { x, y };
    });

    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

    return (
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
          <span>
            Min: {minVal}
            {goal?.unit ? ` ${goal.unit}` : ""}
          </span>
          <span>
            Max: {maxVal}
            {goal?.unit ? ` ${goal.unit}` : ""}
          </span>
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-32 w-full rounded-lg border border-slate-800 bg-slate-950/80"
        >
          {/* 背景グリッドっぽいライン */}
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

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-300">Loading goal...</p>
      </div>
    );
  }

  if (loadError || !goal) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-400">
          {loadError ?? "Goal not found."}
        </p>
        <Link
          href="/goals"
          className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:border-slate-500 hover:bg-slate-900"
        >
          Back to goals
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {goal.is_pinned && (
              <span className="inline-flex items-center rounded-full border border-emerald-400 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-200">
                Pinned
              </span>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              {goal.title}
            </h1>
          </div>
          {goal.description && (
            <p className="text-sm text-slate-300">{goal.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5">
              {formatGoalType(goal.goal_type)}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5">
              {formatTrackerLabel(uiTrackerType, goal.unit)}
            </span>
            {goal.target_value !== null && (
              <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5">
                Target: {goal.target_value}
                {goal.unit ? ` ${goal.unit}` : ""}
              </span>
            )}
            {goal.target_date && (
              <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5">
                Until {formatDateLabel(goal.target_date)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/goals/${goal.id}/edit`}
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:border-slate-500 hover:bg-slate-900"
          >
            Edit goal
          </Link>
          <Link
            href="/goals"
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:border-slate-500 hover:bg-slate-900"
          >
            Back to list
          </Link>
        </div>
      </header>

      {/* Input section */}
      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200">
          Add entry
        </h2>

        {uiTrackerType === "unset" && (
          <p className="text-sm text-slate-400">
            Tracker type is not set yet. You can still keep this goal as a
            reference, or{" "}
            <Link
              href={`/goals/${goal.id}/edit`}
              className="text-emerald-400 underline underline-offset-2"
            >
              set a tracker from the edit page
            </Link>
            .
          </p>
        )}

        {uiTrackerType === "checkin" && (
          <form onSubmit={handleAddCheckin} className="space-y-3">
            <p className="text-xs text-slate-400">
              Press the button to mark today as done. You can optionally leave a
              short reflection.
            </p>

            <div className="space-y-1.5">
              <label
                htmlFor="checkinReflection"
                className="block text-sm font-medium text-slate-100"
              >
                Reflection (optional)
              </label>
              <textarea
                id="checkinReflection"
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                placeholder="How did it go today?"
                value={checkinReflection}
                onChange={(e) => setCheckinReflection(e.target.value)}
              />
            </div>

            {entryError && (
              <p className="text-xs text-rose-400">{entryError}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingEntry}
                className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:opacity-70 disabled:hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {savingEntry ? "Saving..." : "Mark today as done"}
              </button>
            </div>
          </form>
        )}

        {uiTrackerType === "numeric" && (
          <form onSubmit={handleAddNumeric} className="space-y-4">
            <p className="text-xs text-slate-400">
              Input a value for this goal. You can change the date if you are
              logging past data.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-1">
                <label
                  htmlFor="numericDate"
                  className="block text-sm font-medium text-slate-100"
                >
                  Date
                </label>
                <input
                  id="numericDate"
                  type="date"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  value={numericDate}
                  onChange={(e) => setNumericDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label
                  htmlFor="numericValue"
                  className="block text-sm font-medium text-slate-100"
                >
                  Value
                </label>
                <input
                  id="numericValue"
                  type="number"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  placeholder={
                    goal.unit ? `e.g. 65 (${goal.unit})` : "e.g. 65"
                  }
                  value={numericValue}
                  onChange={(e) => setNumericValue(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-100">
                  Unit
                </label>
                <p className="text-sm text-slate-400">
                  {goal.unit || "(no unit set)"}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="numericReflection"
                className="block text-sm font-medium text-slate-100"
              >
                Reflection (optional)
              </label>
              <textarea
                id="numericReflection"
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                placeholder="Any notes about today?"
                value={numericReflection}
                onChange={(e) => setNumericReflection(e.target.value)}
              />
            </div>

            {entryError && (
              <p className="text-xs text-rose-400">{entryError}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingEntry}
                className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:opacity-70 disabled:hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {savingEntry ? "Saving..." : "Add entry"}
              </button>
            </div>
          </form>
        )}

        {uiTrackerType === "numeric" && renderNumericChart()}
      </section>

      {/* Entries list */}
      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-slate-200">
            History
          </h2>
          <p className="text-xs text-slate-500">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"}
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">No entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {[...entries]
              .sort((a, b) => {
                // 新しい順で表示
                if (a.entry_date === b.entry_date) {
                  return (
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                  );
                }
                return (
                  new Date(b.entry_date).getTime() -
                  new Date(a.entry_date).getTime()
                );
              })
              .map((entry) => <li
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-200">
                      {formatDateLabel(entry.entry_date)}
                    </p>
                    {uiTrackerType === "checkin" && (
                      <p className="text-xs text-slate-300">
                        {entry.is_done ? "Done" : "Not done"}
                      </p>
                    )}
                    {uiTrackerType === "numeric" && entry.value !== null && (
                      <p className="text-xs text-slate-300">
                        Value: {entry.value}
                        {goal.unit ? ` ${goal.unit}` : ""}
                      </p>
                    )}
                    {entry.reflection && (
                      <p className="text-xs text-slate-400">{entry.reflection}</p>
                    )}
                  </div>

                  {/* ★ 差し替え後の右側ブロック */}
                  <div className="flex flex-col items-end gap-1 text-[10px] text-slate-500">
                    <span>
                      Logged at{" "}
                      {new Date(entry.created_at).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteEntry(entry.id);
                      }}
                      disabled={deletingEntryId === entry.id}
                      className="inline-flex items-center justify-center rounded-md border border-slate-700 px-1.5 py-1 text-[10px] text-slate-300 hover:border-rose-500 hover:text-rose-300 hover:bg-slate-900 disabled:opacity-60 disabled:hover:border-slate-700 disabled:hover:text-slate-300"
                      aria-label="Delete entry"
                    >
                      🗑
                    </button>
                  </div>
                </li>
                )}
          </ul>
        )}
      </section>
    </div>
  );
}
