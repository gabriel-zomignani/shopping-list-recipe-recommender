"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  deleteHistorySession,
  readHistorySessions,
  saveHistorySession,
} from "@/lib/recipes/history";
import { generateRecipesForSession } from "@/lib/recipes/session";
import type { RecipeHistorySession } from "@/types/history";
import type { ShoppingItem } from "@/types/shopping";

function formatSessionSummary(session: RecipeHistorySession) {
  const maxTimeLabel =
    session.filters.maxTime === "any" ? "any time" : `${session.filters.maxTime} min max`;
  const missingLabel =
    session.filters.maxMissing === "any"
      ? "any missing"
      : `${session.filters.maxMissing} missing max`;
  const pantryLabel = session.filters.assumeStaples ? "pantry on" : "pantry off";
  return `${session.recipes.length} recipes | ${maxTimeLabel} | ${missingLabel} | ${pantryLabel}`;
}

export default function HistoryClient() {
  const [sessions, setSessions] = useState<RecipeHistorySession[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setSessions(readHistorySessions());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleDelete = useCallback((id: string) => {
    setSessions(deleteHistorySession(id));
    setToast("Session deleted");
  }, []);

  const handleRerun = useCallback((session: RecipeHistorySession) => {
    const syntheticItems: ShoppingItem[] = session.availableIngredients.map((name, index) => ({
      id: `session-item-${index + 1}`,
      name,
      checked: true,
      source: "manual",
      normalizedName: name.trim().toLowerCase(),
    }));

    const rerun = generateRecipesForSession(syntheticItems, session.filters);
    const updatedSession: RecipeHistorySession = {
      ...session,
      timestamp: new Date().toISOString(),
      recipes: rerun.recipes,
      availableIngredients: rerun.availableIngredients,
    };

    setSessions(saveHistorySession(updatedSession));
    setToast("Session re-run and updated");
  }, []);

  return (
    <main className="min-h-screen pb-12">
      <div className="bg-[var(--brand-red)] text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-3xl font-black tracking-tight">ZomigValu</p>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold underline-offset-2 hover:underline">
              Back to planner
            </Link>
            <Link href="/logout" className="text-sm font-semibold underline-offset-2 hover:underline">
              Log out
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#d4d9df] bg-white p-5 shadow-sm sm:p-7">
          <h1 className="text-2xl font-extrabold text-[var(--brand-red-strong)]">
            Generation History
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Saved sessions: {sessions.length}
          </p>

          {sessions.length === 0 ? (
            <p className="mt-4 rounded-xl border border-[var(--border-soft)] bg-slate-50 px-4 py-3 text-sm text-[var(--ink-soft)]">
              No history yet. Generate recipes and click Save session from the planner page.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {sessions.map((session) => (
                <article
                  key={session.id}
                  className="rounded-xl border border-[var(--border-soft)] bg-white p-4"
                >
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    Generated {formatSessionSummary(session)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {new Date(session.timestamp).toLocaleString()}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/?session=${session.id}`}
                      className="rounded-lg border border-[var(--border-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--ink-soft)] transition hover:bg-slate-50"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRerun(session)}
                      className="rounded-lg bg-[var(--brand-green)] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-green-strong)]"
                    >
                      Re-run
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(session.id)}
                      className="rounded-lg border border-[var(--brand-red)] px-3 py-1.5 text-sm font-semibold text-[var(--brand-red)] transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {toast ? (
        <p
          className="fixed right-4 top-4 z-40 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 shadow-sm"
          role="status"
          aria-live="polite"
        >
          {toast}
        </p>
      ) : null}
    </main>
  );
}
