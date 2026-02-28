"use client";

import { useState } from "react";

type Props = {
  onAdd: (name: string) => void;
};

export default function AddItemForm({ onAdd }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    onAdd(name);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
      <input
        className="w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 py-2.5 text-sm text-[var(--ink)] shadow-sm outline-none transition focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20"
        placeholder="Add an item (e.g., eggs)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="rounded-xl bg-[var(--brand-green)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(23,128,58,0.3)] transition hover:bg-[var(--brand-green-strong)]"
      >
        Add
      </button>
    </form>
  );
}
