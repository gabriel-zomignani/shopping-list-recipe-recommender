"use client";

import { memo } from "react";
import type { ShoppingItem } from "@/types/shopping";

type Props = {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

function ShoppingListItem({ item, onToggle, onRemove }: Props) {
  const sourceLabel =
    item.source === "receipt" ? "receipt" : item.source === "recipe" ? "recipe" : null;

  return (
    <li
      className={`flex items-center justify-between rounded-xl border px-3 py-3 transition ${
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
          {item.quantity !== undefined ? ` (${item.quantity}${item.unit ?? ""})` : ""}
        </span>
        {sourceLabel ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {sourceLabel}
          </span>
        ) : null}
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

export default memo(ShoppingListItem);
