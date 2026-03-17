"use client";

import { useEffect, useMemo, useState } from "react";
import ReceiptUpload from "@/components/receipt/ReceiptUpload";
import type {
  ReceiptExtractionResult,
  ReceiptImportItem,
  ReceiptReviewItem,
} from "@/types/receipt";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (items: ReceiptImportItem[]) => void;
};

function buildReviewItems(items: ReceiptExtractionResult["items"]): ReceiptReviewItem[] {
  return items.map((item, index) => ({
    id: `${crypto.randomUUID()}-${index}`,
    include: true,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
  }));
}

function isErrorPayload(
  value: ReceiptExtractionResult | { error?: string }
): value is { error?: string } {
  return "error" in value;
}

export default function ReceiptReviewModal({ isOpen, onClose, onAdd }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ReceiptExtractionResult | null>(null);
  const [items, setItems] = useState<ReceiptReviewItem[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setError(null);
      setExtracted(null);
      setItems([]);
    }
  }, [isOpen]);

  const selectedCount = useMemo(
    () => items.filter((item) => item.include && item.name.trim().length > 0).length,
    [items]
  );

  if (!isOpen) return null;

  function updateItem(id: string, patch: Partial<ReceiptReviewItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function handleExtract(file: File) {
    const formData = new FormData();
    formData.set("receipt", file);

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/receipt", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ReceiptExtractionResult | { error?: string };

      if (!response.ok) {
        const message = isErrorPayload(payload)
          ? payload.error || "Receipt extraction failed."
          : "Receipt extraction failed.";
        throw new Error(message);
      }

      if (isErrorPayload(payload)) {
        throw new Error(payload.error || "Receipt extraction failed.");
      }

      setExtracted(payload);
      setItems(buildReviewItems(payload.items));
      if (payload.items.length === 0) {
        setError("No grocery items were detected. Try a clearer receipt image.");
      }
    } catch (extractError) {
      setExtracted(null);
      setItems([]);
      setError(
        extractError instanceof Error ? extractError.message : "Receipt extraction failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAdd() {
    const selectedItems: ReceiptImportItem[] = items
      .filter((item) => item.include && item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity ?? undefined,
        unit: item.unit?.trim() || undefined,
        source: "receipt",
      }));

    onAdd(selectedItems);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--border-soft)] bg-[#fffaf7] p-5 shadow-lg sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-[var(--brand-red-strong)]">
              Import receipt
            </h3>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Upload a receipt, review the extracted groceries, then add only what you want to
              your local shopping list.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border-soft)] px-3 py-2 text-sm font-semibold text-[var(--ink-soft)]"
          >
            Close
          </button>
        </div>

        {!extracted ? (
          <div className="mt-5">
            <ReceiptUpload isSubmitting={isSubmitting} error={error} onExtract={handleExtract} />
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--ink-soft)]">
              <span>
                <span className="font-semibold text-[var(--ink)]">Store:</span>{" "}
                {extracted.store ?? "Unknown"}
              </span>
              <span>
                <span className="font-semibold text-[var(--ink)]">Date:</span>{" "}
                {extracted.date ?? "Unknown"}
              </span>
              <span>
                <span className="font-semibold text-[var(--ink)]">Detected items:</span>{" "}
                {items.length}
              </span>
            </div>

            {error ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                {error}
              </p>
            ) : null}

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 rounded-2xl border border-[var(--border-soft)] bg-white p-3 md:grid-cols-[auto_1.5fr_120px_120px_auto]"
                >
                  <label className="flex items-center justify-center pt-2 md:pt-0">
                    <input
                      type="checkbox"
                      checked={item.include}
                      onChange={(event) => updateItem(item.id, { include: event.target.checked })}
                      className="h-4 w-4 accent-[var(--brand-green)]"
                    />
                  </label>
                  <input
                    value={item.name}
                    onChange={(event) => updateItem(item.id, { name: event.target.value })}
                    className="rounded-lg border border-[var(--border-soft)] px-3 py-2 text-sm text-[var(--ink)]"
                    placeholder="Item name"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.quantity ?? ""}
                    onChange={(event) =>
                      updateItem(item.id, {
                        quantity: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                    className="rounded-lg border border-[var(--border-soft)] px-3 py-2 text-sm text-[var(--ink)]"
                    placeholder="Qty"
                  />
                  <input
                    value={item.unit ?? ""}
                    onChange={(event) => updateItem(item.id, { unit: event.target.value || null })}
                    className="rounded-lg border border-[var(--border-soft)] px-3 py-2 text-sm text-[var(--ink)]"
                    placeholder="Unit"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateItem(item.id, {
                        include: false,
                      })
                    }
                    className="rounded-lg border border-[var(--border-soft)] px-3 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:bg-slate-50"
                  >
                    Skip
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[var(--ink-soft)]">
                Ready to import: {selectedCount}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExtracted(null);
                    setItems([]);
                    setError(null);
                  }}
                  className="rounded-lg border border-[var(--border-soft)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)]"
                >
                  Upload another receipt
                </button>
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
                  className="rounded-lg bg-[var(--brand-green)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-green-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add selected to my list
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
