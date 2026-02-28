"use client";

import { useMemo, useState } from "react";
import type { ShoppingItemSource } from "@/types/shopping";

type ReceiptDraftItem = {
  id: string;
  include: boolean;
  name: string;
  quantity?: number;
  unit?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    items: Array<{
      name: string;
      quantity?: number;
      unit?: string;
      source: ShoppingItemSource;
    }>
  ) => void;
};

const MOCK_EXTRACTED_ITEMS: ReceiptDraftItem[] = [
  { id: "r1", include: true, name: "milk", quantity: 2, unit: "L" },
  { id: "r2", include: true, name: "eggs", quantity: 12, unit: "pcs" },
  { id: "r3", include: true, name: "bread", quantity: 1, unit: "loaf" },
  { id: "r4", include: true, name: "banana", quantity: 6, unit: "pcs" },
];

export default function ReceiptImportReview({ isOpen, onClose, onAdd }: Props) {
  const [items, setItems] = useState<ReceiptDraftItem[]>(MOCK_EXTRACTED_ITEMS);

  const selectedCount = useMemo(
    () => items.filter((item) => item.include && item.name.trim().length > 0).length,
    [items]
  );

  if (!isOpen) return null;

  function updateItem(id: string, patch: Partial<ReceiptDraftItem>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function handleAdd() {
    const selected = items
      .filter((item) => item.include && item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity,
        unit: item.unit?.trim() || undefined,
        source: "receipt" as const,
      }));

    onAdd(selected);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-[var(--border-soft)] bg-white p-5 shadow-lg sm:p-7">
        <h3 className="text-xl font-extrabold text-[var(--brand-red-strong)]">
          Review extracted receipt items
        </h3>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Mocked extraction preview. Edit names/quantities and uncheck anything you do not
          want to import.
        </p>

        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[auto_1fr_100px_90px] items-center gap-2 rounded-xl border border-[var(--border-soft)] p-2"
            >
              <input
                type="checkbox"
                checked={item.include}
                onChange={(event) => updateItem(item.id, { include: event.target.checked })}
                className="h-4 w-4 accent-[var(--brand-green)]"
              />
              <input
                value={item.name}
                onChange={(event) => updateItem(item.id, { name: event.target.value })}
                className="rounded-md border border-[var(--border-soft)] px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                step={1}
                value={item.quantity ?? ""}
                onChange={(event) =>
                  updateItem(item.id, {
                    quantity: event.target.value ? Number(event.target.value) : undefined,
                  })
                }
                className="rounded-md border border-[var(--border-soft)] px-2 py-1.5 text-sm"
                placeholder="Qty"
              />
              <input
                value={item.unit ?? ""}
                onChange={(event) => updateItem(item.id, { unit: event.target.value })}
                className="rounded-md border border-[var(--border-soft)] px-2 py-1.5 text-sm"
                placeholder="Unit"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--ink-soft)]">
            Selected items: {selectedCount}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border-soft)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={selectedCount === 0}
              className="rounded-lg bg-[var(--brand-green)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add selected to my list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
