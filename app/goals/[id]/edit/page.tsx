// app/goals/[id]/edit/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type GoalType = "north_star" | "mid_term" | "habit";
type TrackerType = "unset" | "checkin" | "numeric";

type Goal = {
  id: string;
  user_id: string | null;

  title: string;
  description: string | null;

  goal_type: GoalType;
  tracker_type: "checkin" | "numeric" | null;

  unit: string | null;
  target_value: number | null;
  target_date: string | null;

  is_pinned: boolean;
  is_hidden: boolean;
  sort_order: number;

  created_at: string;
  updated_at: string;
};

export default function EditGoalPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [goalType, setGoalType] = useState<GoalType>("mid_term");
  const [trackerType, setTrackerType] = useState<TrackerType>("unset");

  const [unit, setUnit] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const [isPinned, setIsPinned] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 初期データ読み込み
  useEffect(() => {
    if (!goalId) return;

    async function fetchGoal() {
      setLoading(true);
      setLoadError(null);
      try {
        const { data, error } = await supabase
          .from("goals")
          .select("*")
          .eq("id", goalId)
          .single();

        if (error || !data) {
          console.error("[edit goal] fetch error", error);
          setLoadError("Failed to load this goal.");
          setLoading(false);
          return;
        }

        const goal = data as Goal;

        setTitle(goal.title);
        setDescription(goal.description ?? "");
        setGoalType(goal.goal_type);
        setTrackerType(goal.tracker_type ? goal.tracker_type : "unset");
        setUnit(goal.unit ?? "");
        setTargetValue(
          goal.target_value !== null && goal.target_value !== undefined
            ? String(goal.target_value)
            : ""
        );
        setTargetDate(goal.target_date ?? "");
        setIsPinned(goal.is_pinned);

        setLoading(false);
      } catch (err) {
        console.error("[edit goal] unexpected error", err);
        setLoadError("Failed to load this goal.");
        setLoading(false);
      }
    }

    fetchGoal();
  }, [goalId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!goalId) {
      setErrorMessage("Invalid goal.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }

    setSubmitting(true);

    try {
      const numericTarget =
        trackerType === "numeric" && targetValue.trim() !== ""
          ? Number(targetValue)
          : null;

      if (
        trackerType === "numeric" &&
        targetValue.trim() !== "" &&
        isNaN(Number(targetValue))
      ) {
        setErrorMessage("Target value must be a number.");
        setSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from("goals")
        .update({
          title: title.trim(),
          description: description.trim() || null,

          goal_type: goalType,
          tracker_type: trackerType === "unset" ? null : trackerType,

          unit: trackerType === "numeric" ? unit.trim() || null : null,
          target_value: numericTarget,
          target_date: targetDate || null,

          is_pinned: isPinned,
          // is_hidden はここでは触らない
        })
        .eq("id", goalId)
        .select()
        .single();

      if (error) {
        console.error("[edit goal] update error", error);
        setErrorMessage("Failed to save changes. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push("/goals");
      router.refresh();
    } catch (err) {
      console.error("[edit goal] unexpected error", err);
      setErrorMessage("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

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

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-300">Loading goal...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-400">{loadError}</p>
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
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Edit Goal
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Update this goal and how you track it.
          </p>
        </div>

        <Link
          href="/goals"
          className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:border-slate-500 hover:bg-slate-900"
        >
          Back
        </Link>
      </header>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5"
      >
        {/* Title */}
        <div className="space-y-1.5">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-100"
          >
            Title <span className="text-emerald-400">*</span>
          </label>
          <input
            id="title"
            type="text"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-100"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            placeholder="Optional notes about this goal."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Goal type */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-100">Goal type</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGoalType("north_star")}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                goalType === "north_star"
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
              }`}
            >
              North Star Goal
            </button>
            <button
              type="button"
              onClick={() => setGoalType("mid_term")}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                goalType === "mid_term"
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
              }`}
            >
              Mid-term Goal
            </button>
            <button
              type="button"
              onClick={() => setGoalType("habit")}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                goalType === "habit"
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
              }`}
            >
              Daily Habit
            </button>
          </div>
          <p className="text-xs text-slate-500">
            North Star: big, long-term vision. Mid-term: measurable goals like
            weight or score. Daily Habit: everyday actions.
          </p>
        </div>

        {/* Tracker type */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-100">Tracker type</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTrackerType("unset")}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                trackerType === "unset"
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
              }`}
            >
              Not set yet
            </button>

            <button
              type="button"
              onClick={() => setTrackerType("checkin")}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                trackerType === "checkin"
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
              }`}
            >
              Check-in (Done / Not done)
            </button>
            <button
              type="button"
              onClick={() => setTrackerType("numeric")}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                trackerType === "numeric"
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
              }`}
            >
              Numeric (value input)
            </button>
          </div>
          <p className="text-xs text-slate-500">
            You can leave it as &quot;Not set yet&quot; if you only want to
            keep the goal without a tracker.
          </p>
        </div>

        {/* Numeric tracker specific fields */}
        {trackerType === "numeric" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <label
                htmlFor="unit"
                className="block text-sm font-medium text-slate-100"
              >
                Unit
              </label>
              <input
                id="unit"
                type="text"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                placeholder="kg, min, lesson..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1">
              <label
                htmlFor="targetValue"
                className="block text-sm font-medium text-slate-100"
              >
                Target value
              </label>
              <input
                id="targetValue"
                type="number"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1">
              <label
                htmlFor="targetDate"
                className="block text-sm font-medium text-slate-100"
              >
                Target date
              </label>
              <input
                id="targetDate"
                type="date"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Pinned */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPinned((v) => !v)}
            className={`inline-flex h-5 w-9 items-center rounded-full border transition ${
              isPinned
                ? "border-emerald-400 bg-emerald-500/20"
                : "border-slate-700 bg-slate-950"
            }`}
          >
            <span
              className={`ml-0.5 inline-block h-4 w-4 rounded-full bg-slate-300 transition ${
                isPinned ? "translate-x-4 bg-emerald-400" : ""
              }`}
            />
          </button>
          <span className="text-sm text-slate-200">Pin this goal</span>
        </div>

        {/* Error */}
        {errorMessage && (
          <p className="text-sm text-rose-400">{errorMessage}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/goals")}
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:border-slate-500 hover:bg-slate-900"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:opacity-70 disabled:hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
