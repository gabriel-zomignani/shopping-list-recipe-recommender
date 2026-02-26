"use client";

import type { ShoppingItem } from "@/types/shopping";
import ShoppingListItem from "./ShoppingListItem";

type Props = {
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function ShoppingList({ items, onToggle, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <p className="mt-4 text-gray-600">
        Add items to get started.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
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