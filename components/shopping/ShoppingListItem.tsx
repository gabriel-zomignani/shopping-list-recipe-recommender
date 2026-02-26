"use client";

import type { ShoppingItem } from "@/types/shopping";

type Props = {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function ShoppingListItem({ item, onToggle, onRemove }: Props) {
  return (
    <li className="flex items-center justify-between rounded-md border p-3">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={() => onToggle(item.id)}
          className="h-4 w-4"
        />
        <span className={item.checked ? "line-through text-gray-500" : ""}>
          {item.name}
        </span>
      </label>

      <button
        onClick={() => onRemove(item.id)}
        className="text-sm text-red-600 hover:underline"
        aria-label={`Remove ${item.name}`}
      >
        Remove
      </button>
    </li>
  );
}