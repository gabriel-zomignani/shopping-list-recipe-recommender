"use client";

import type { ShoppingItem } from "@/types/shopping";

type Props = {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function ShoppingListItem({ item, onToggle, onRemove }: Props) {
  return (
    <li
      className={`flex items-center justify-between rounded-xl border px-3 py-3 shadow-sm transition ${
        item.checked
          ? "border-slate-200 bg-slate-50"
          : "border-[var(--border-soft)] bg-white"
      }`}
    >
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={() => onToggle(item.id)}
          className="h-4 w-4 accent-[var(--brand-red)]"
        />
        <span
          className={`text-sm ${
            item.checked ? "text-slate-500 line-through" : "text-[var(--ink)]"
          }`}
        >
          {item.name}
        </span>
      </label>

      <button
        onClick={() => onRemove(item.id)}
        className="rounded-md px-2 py-1 text-xs font-semibold text-[var(--brand-red)] transition hover:bg-red-50"
        aria-label={`Remove ${item.name}`}
      >
        Remove
      </button>
    </li>
  );
}
