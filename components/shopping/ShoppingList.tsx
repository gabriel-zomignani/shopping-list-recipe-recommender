"use client";

import type { ShoppingItem } from "@/types/shopping";
import ShoppingListItem from "./ShoppingListItem";

type Props = {
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onQuickAdd: (name: string) => void;
};

const QUICK_SUGGESTIONS = ["milk", "eggs", "rice"];

function compareByStatusThenName(a: ShoppingItem, b: ShoppingItem) {
  if (a.checked !== b.checked) return Number(a.checked) - Number(b.checked);
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

export default function ShoppingList({
  items,
  onToggle,
  onRemove,
  onQuickAdd,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-[var(--brand-red)]/35 bg-red-50/35 p-5">
        <p className="text-sm font-semibold text-[var(--ink)]">Your shopping list is empty.</p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Try adding a starter item:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_SUGGESTIONS.map((name) => (
            <button
              key={name}
              onClick={() => onQuickAdd(name)}
              className="rounded-full border border-[var(--brand-red)]/30 bg-white px-3 py-1.5 text-sm font-medium text-[var(--brand-red)] transition hover:bg-red-50"
            >
              + {name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const sortedItems = [...items].sort(compareByStatusThenName);

  return (
    <ul className="mt-5 space-y-2.5">
      {sortedItems.map((item) => (
        <ShoppingListItem
          key={item.id}
          item={item}
          onToggle={onToggle}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}
