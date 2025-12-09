"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type Topic = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

type StoredData = {
  topics: Topic[];
  contentsByTopicId: Record<string, string>;
  checklistModeByTopicId: Record<string, boolean>;
  checksByTopicId: Record<string, boolean[]>;
};

const STORAGE_KEY = "tidymemo-notepad-v3";

function createInitialData(): StoredData {
  const now = Date.now();
  const initialTopic: Topic = {
    id: crypto.randomUUID(),
    title: "Untitled",
    createdAt: now,
    updatedAt: now,
  };
  return {
    topics: [initialTopic],
    contentsByTopicId: { [initialTopic.id]: "" },
    checklistModeByTopicId: {},
    checksByTopicId: {},
  };
}

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contentsByTopicId, setContentsByTopicId] = useState<
    Record<string, string>
  >({});
  const [checklistModeByTopicId, setChecklistModeByTopicId] = useState<
    Record<string, boolean>
  >({});
  const [checksByTopicId, setChecksByTopicId] = useState<
    Record<string, boolean[]>
  >({});
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  // ===== 初期ロード：まず Supabase のユーザーを確認 =====
  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user ?? null);

        if (user) {
          // ログインしている → Supabase からロード
          const { data, error } = await supabase
            .from("memo_documents")
            .select("data")
            .eq("user_id", user.id)
            .maybeSingle();

          if (error) {
            console.error("Failed to load memo_documents:", error);
          }

          if (data && data.data) {
            const stored = data.data as StoredData;
            // 最低限のフォールバック
            if (!stored.topics || stored.topics.length === 0) {
              const initData = createInitialData();
              applyStoredData(initData);
            } else {
              applyStoredData(stored);
            }
          } else {
            // 初回ユーザー → 初期データを作成しつつ Supabase に保存
            const initData = createInitialData();
            applyStoredData(initData);
            await supabase.from("memo_documents").insert({
              user_id: user.id,
              data: initData,
            });
          }
        } else {
          // ログインしていない → localStorage からロード
          if (typeof window !== "undefined") {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
              try {
                const stored = JSON.parse(raw) as StoredData;
                if (stored.topics && stored.topics.length > 0) {
                  applyStoredData(stored);
                } else {
                  applyStoredData(createInitialData());
                }
              } catch (e) {
                console.error("Failed to parse local data:", e);
                applyStoredData(createInitialData());
              }
            } else {
              applyStoredData(createInitialData());
            }
          } else {
            applyStoredData(createInitialData());
          }
        }
      } finally {
        setInitialized(true);
      }
    };

    const applyStoredData = (stored: StoredData) => {
      setTopics(stored.topics);
      setContentsByTopicId(stored.contentsByTopicId || {});
      setChecklistModeByTopicId(stored.checklistModeByTopicId || {});
      setChecksByTopicId(stored.checksByTopicId || {});
      setSelectedTopicId(stored.topics[0]?.id ?? null);
    };

    init();
  }, []);

  // ===== 派生データ =====

  const selectedTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopicId) ?? null,
    [topics, selectedTopicId]
  );

  const currentContent = useMemo(() => {
    if (!selectedTopicId) return "";
    return contentsByTopicId[selectedTopicId] ?? "";
  }, [contentsByTopicId, selectedTopicId]);

  const checklistMode = useMemo(() => {
    if (!selectedTopicId) return false;
    return checklistModeByTopicId[selectedTopicId] ?? false;
  }, [checklistModeByTopicId, selectedTopicId]);

  const currentLines = useMemo(
    () => currentContent.split("\n"),
    [currentContent]
  );

  const currentChecks = useMemo(() => {
    if (!selectedTopicId) return [];
    const raw = checksByTopicId[selectedTopicId] ?? [];
    if (raw.length >= currentLines.length) return raw.slice(0, currentLines.length);
    return [...raw, ...Array(currentLines.length - raw.length).fill(false)];
  }, [checksByTopicId, currentLines.length, selectedTopicId]);

  const sortedTopics = useMemo(
    () => [...topics].sort((a, b) => b.updatedAt - a.updatedAt),
    [topics]
  );

  // ===== 共通：現在の状態を StoredData 形式にまとめる =====
  const buildStoredData = (): StoredData => ({
    topics,
    contentsByTopicId,
    checklistModeByTopicId,
    checksByTopicId,
  });

  // ===== 変更時の保存：localStorage + Supabase =====

  // localStorage
  useEffect(() => {
    if (!initialized) return;
    try {
      if (typeof window === "undefined") return;
      const data = buildStoredData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics, contentsByTopicId, checklistModeByTopicId, checksByTopicId, initialized]);

  // Supabase
  useEffect(() => {
    if (!initialized || !user) return;

    const sync = async () => {
      try {
        setSaving(true);
        const data = buildStoredData();

        // 既に insert 済みのレコードを user_id で UPDATE する
        const { error } = await supabase
          .from("memo_documents")
          .update({
            data,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) {
          console.error(
            "Failed to update memo_documents:",
            error.message,
            error
          );
        }
      } finally {
        setSaving(false);
      }
    };

    sync();
  }, [
    topics,
    contentsByTopicId,
    checklistModeByTopicId,
    checksByTopicId,
    initialized,
    user,
  ]);


  // ===== 以下は、前回までと同じUIロジック（中身だけSupabase対応版） =====

  const handleAddTopic = () => {
    const now = Date.now();
    const topic: Topic = {
      id: crypto.randomUUID(),
      title: "New note",
      createdAt: now,
      updatedAt: now,
    };
    setTopics((prev) => [...prev, topic]);
    setContentsByTopicId((prev) => ({ ...prev, [topic.id]: "" }));
    setChecklistModeByTopicId((prev) => ({ ...prev, [topic.id]: false }));
    setChecksByTopicId((prev) => ({ ...prev, [topic.id]: [] }));
    setSelectedTopicId(topic.id);
  };

  const handleDeleteTopic = (id: string) => {
    const topic = topics.find((t) => t.id === id);
    const name = topic?.title?.trim() || "this note";

    if (typeof window !== "undefined") {
      const ok = window.confirm(
        `Delete "${name}"?\nThis action cannot be undone.`
      );
      if (!ok) return;
    }

    setTopics((prev) => prev.filter((t) => t.id !== id));
    setContentsByTopicId((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setChecklistModeByTopicId((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setChecksByTopicId((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    if (selectedTopicId === id) {
      const remaining = topics.filter((t) => t.id !== id);
      setSelectedTopicId(remaining[0]?.id ?? null);
    }
  };

  const handleTopicTitleChange = (id: string, title: string) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, title, updatedAt: Date.now() } : t
      )
    );
  };

  const handleContentChange = (value: string) => {
    if (!selectedTopicId) return;
    setContentsByTopicId((prev) => ({
      ...prev,
      [selectedTopicId]: value,
    }));
    setTopics((prev) =>
      prev.map((t) =>
        t.id === selectedTopicId ? { ...t, updatedAt: Date.now() } : t
      )
    );
  };

  const toggleChecklistMode = () => {
    if (!selectedTopicId) return;
    setChecklistModeByTopicId((prev) => ({
      ...prev,
      [selectedTopicId]: !(prev[selectedTopicId] ?? false),
    }));
  };

    const toggleLineCheck = (index: number) => {
    if (!selectedTopicId) return;

    // 現在の行とチェック状態をコピー
    const lines = [...currentLines];
    const checks = [...currentChecks];

    const prevChecked = checks[index] ?? false;
    const newChecked = !prevChecked;
    checks[index] = newChecked;

    type Item = { text: string; checked: boolean; isToggled: boolean };

    const items: Item[] = lines.map((text, i) => ({
      text,
      checked: checks[i] ?? false,
      isToggled: i === index,
    }));

    let unchecked: Item[] = [];
    let checkedItems: Item[] = [];

    for (const item of items) {
      if (item.checked) checkedItems.push(item);
      else unchecked.push(item);
    }

    if (newChecked) {
      // ✅ 今チェックが付いた行 → チェック済みグループの先頭へ
      const toggled = checkedItems.find((i) => i.isToggled)!;
      const others = checkedItems.filter((i) => !i.isToggled);
      checkedItems = [toggled, ...others];
    } else {
      // ⬜ チェックを外した行 → 未完了グループの最後へ
      const toggled = unchecked.find((i) => i.isToggled)!;
      const others = unchecked.filter((i) => !i.isToggled);
      unchecked = [...others, toggled];
    }

    const reordered = [...unchecked, ...checkedItems];
    const newLines = reordered.map((i) => i.text);
    const newChecks = reordered.map((i) => i.checked);

    // 本文テキスト自体も並び替える（ノーマルモードに戻っても順番が反映される）
    handleContentChange(newLines.join("\n"));

    // チェック状態も並び替え後の配列で保存
    setChecksByTopicId((prev) => ({
      ...prev,
      [selectedTopicId]: newChecks,
    }));
  };


  const handleLineTextChange = (index: number, value: string) => {
    const lines = [...currentLines];
    lines[index] = value;
    handleContentChange(lines.join("\n"));
  };

  // ===== UI =====

  return (
    <main
      className="mx-auto max-w-5xl px-4 py-6 text-white"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, system-ui, sans-serif',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-yellow-300">
          TidyMemo
        </h1>
        {user && (
          <span className="text-xs text-zinc-400">
            {saving ? "Saving…" : "Saved"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-4 h-[70vh]">
        {/* Sidebar: topics */}
        <aside className="rounded-xl bg-zinc-900/90 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/70">
            <span className="text-xs font-semibold uppercase tracking-wide text-yellow-300">
              Topics
            </span>
            <button
              type="button"
              onClick={handleAddTopic}
              className="text-xs px-2 py-1 rounded-md border border-yellow-300 text-yellow-200 hover:bg-yellow-300 hover:text-black transition-colors"
            >
              + New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sortedTopics.length === 0 ? (
              <p className="text-xs text-zinc-400 px-3 py-3">
                Create a note to get started.
              </p>
            ) : (
              <ul className="text-sm">
                {sortedTopics.map((topic) => {
                  const isActive = topic.id === selectedTopicId;
                  return (
                    <li
                      key={topic.id}
                      className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer ${
                        isActive
                          ? "bg-yellow-300 text-black"
                          : "hover:bg-zinc-800"
                      }`}
                      onClick={() => setSelectedTopicId(topic.id)}
                    >
                      <span className="truncate">
                        {topic.title || "Untitled"}
                      </span>
                      <button
                        type="button"
                        className={`text-[10px] ${
                          isActive ? "text-black/70" : "text-zinc-400"
                        } hover:text-red-400`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTopic(topic.id);
                        }}
                        aria-label="Delete topic"
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Main: note */}
        <section className="rounded-xl bg-zinc-900/90 flex flex-col">
          {!selectedTopic ? (
            <div className="p-4 text-sm text-zinc-400">
              Select a note from the sidebar or create a new one.
            </div>
          ) : (
            <>
              {/* title + checklist toggle */}
              <div className="px-4 py-3 border-b border-zinc-800/70 flex items-center justify-between gap-3">
                <input
                  className="w-full text-lg font-semibold bg-transparent border-b border-transparent focus:border-yellow-300 focus:outline-none pb-1 placeholder:text-zinc-500"
                  value={selectedTopic.title}
                  onChange={(e) =>
                    handleTopicTitleChange(selectedTopic.id, e.target.value)
                  }
                  placeholder="Untitled"
                />
                <button
                  type="button"
                  onClick={toggleChecklistMode}
                  className={`ml-2 text-xs px-3 py-1 rounded-full flex items-center gap-1 border ${
                    checklistMode
                      ? "bg-yellow-300 text-black border-yellow-300"
                      : "border-yellow-300 text-yellow-200 hover:bg-yellow-300 hover:text-black"
                  } transition-colors`}
                  title="Toggle checklist mode"
                >
                  <span className="text-base leading-none">☑</span>
                  <span>Checklist</span>
                </button>
              </div>

              {/* body */}
              <div className="flex-1 p-4 overflow-y-auto">
                                {checklistMode ? (
                  <ul className="space-y-1">
                    {currentLines.map((line, index) => (
                      <li key={index} className="py-0.5">
                        <label className="flex items-start gap-3 cursor-pointer">
                          {/* 見えない本物のチェックボックス（状態管理用） */}
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={currentChecks[index] ?? false}
                            onChange={() => toggleLineCheck(index)}
                          />
                          {/* 見た目用のオレンジ四角＋白いチェック */}
                          <span
                            className="
                              mt-1 h-4 w-4 rounded-[3px]
                              border border-zinc-500
                              flex items-center justify-center
                              text-[11px]
                              text-transparent
                              peer-checked:bg-yellow-400
                              peer-checked:border-yellow-400
                              peer-checked:text-black
                              transition-colors
                            "
                          >
                            ✓
                          </span>

                          <input
                            className="flex-1 bg-transparent text-sm focus:outline-none border-b border-transparent focus:border-zinc-700 pb-0.5 placeholder:text-zinc-500"
                            value={line}
                            onChange={(e) =>
                              handleLineTextChange(index, e.target.value)
                            }
                            placeholder={
                              index === 0 ? "Type your first item..." : ""
                            }
                          />
                        </label>
                      </li>
                    ))}
                    {currentLines.length === 1 && currentLines[0] === "" && (
                      <li className="text-xs text-zinc-500">
                        Each line becomes a checklist item. Press Enter to add more.
                      </li>
                    )}
                  </ul>
                ) : (
                  // ← この下の textarea 部分はそのままでOK
                  <textarea
                    className="w-full h-full resize-none bg-transparent rounded-md p-2 text-sm font-normal focus:outline-none placeholder:text-zinc-500"
                    value={currentContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Write anything here. You can turn this note into a checklist with one click."
                  />
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
