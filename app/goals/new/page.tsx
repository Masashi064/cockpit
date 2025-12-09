// app/goals/new/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type GoalType = "north_star" | "mid_term" | "habit";
// 🔹 「未設定」を追加
type TrackerType = "unset" | "checkin" | "numeric";

export default function NewGoalPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [goalType, setGoalType] = useState<GoalType>("mid_term");

  // 🔹 デフォルト「未設定」
  const [trackerType, setTrackerType] = useState<TrackerType>("unset");

  const [unit, setUnit] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");

  // 🔹 デフォルトで ON
  const [isPinned, setIsPinned] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }

    setSubmitting(true);

    try {
      // Numeric のときだけ targetValue を数値に
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
        .insert({
          // user_id: null, // 認証を入れるならここに userId を
          title: title.trim(),
          description: description.trim() || null,

          goal_type: goalType,

          // 🔹 「未設定」の場合は DB には null を入れる
          tracker_type: trackerType === "unset" ? null : trackerType,

          unit: trackerType === "numeric" ? unit.trim() || null : null,
          target_value: numericTarget,
          target_date: targetDate || null,

          is_pinned: isPinned,
          is_hidden: false,
          sort_order: 100,
        })
        .select()
        .single();

      if (error) {
        console.error("[create goal] error raw", error);
        console.error("[create goal] error json", JSON.stringify(error, null, 2));
        setErrorMessage("Failed to create the goal. Please try again.");
        setSubmitting(false);
        return;
      }


      router.push("/goals");
      router.refresh();
    } catch (err) {
      console.error("[create goal] unexpected error", err);
      setErrorMessage("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            New Goal
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Define your goal and how you want to track it.
          </p>
        </div>
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
            placeholder="e.g. Reach 65kg, English conversation practice, Annual vision"
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
            {/* 🔹 未設定ボタン */}
            <button
              type="button"
              onClick={() => setTrackerType("unset")}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                trackerType === "unset"
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
              }`}
            >
              Not set
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
            register the goal first.
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
                placeholder="e.g. 65"
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
            {submitting ? "Creating..." : "Create goal"}
          </button>
        </div>
      </form>
    </div>
  );
}
