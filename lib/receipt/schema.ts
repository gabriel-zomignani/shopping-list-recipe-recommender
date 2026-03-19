import type { ReceiptExtractionItem, ReceiptExtractionResult } from "@/types/receipt";

export const ALLOWED_RECEIPT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_RECEIPT_UPLOAD_BYTES = 8 * 1024 * 1024;

export const RECEIPT_EXTRACTION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["store", "date", "items"],
  properties: {
    store: {
      type: ["string", "null"],
    },
    date: {
      type: ["string", "null"],
    },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "quantity", "unit"],
        properties: {
          name: {
            type: "string",
          },
          quantity: {
            type: ["number", "null"],
          },
          unit: {
            type: ["string", "null"],
          },
        },
      },
    },
  },
} as const;

const RECEIPT_JUNK_PATTERNS = [
  /\bsubtotal\b/i,
  /\btotal\b/i,
  /\btax\b/i,
  /\bvat\b/i,
  /\bchange\b/i,
  /\bcash\b/i,
  /\bpayment\b/i,
  /\bdebit\b/i,
  /\bcredit\b/i,
  /\bcard\b/i,
  /\bloyalty\b/i,
  /\breward\b/i,
  /\bpoints?\b/i,
  /\bcashier\b/i,
  /\bthank you\b/i,
  /\btransaction\b/i,
  /\bauth(entication|orization)?\b/i,
  /\bphone\b/i,
  /\baddress\b/i,
  /\breceipt\b/i,
];

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeNullableString(value: string | null) {
  if (value === null) return null;
  const normalized = collapseWhitespace(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeQuantity(value: number | null) {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  return Number(value.toFixed(2));
}

function normalizeItemName(name: string) {
  return collapseWhitespace(name)
    .replace(/^[\s\-*.,:;]+/, "")
    .replace(/\s+[$€£]?\d+[.,]\d{2}$/, "")
    .trim();
}

function isReceiptJunkLine(name: string) {
  if (!name) return true;
  if (/^\d{6,}$/.test(name)) return true;
  return RECEIPT_JUNK_PATTERNS.some((pattern) => pattern.test(name));
}

function normalizeItem(item: ReceiptExtractionItem): ReceiptExtractionItem | null {
  const name = normalizeItemName(item.name);
  if (!name) return null;
  if (isReceiptJunkLine(name)) return null;

  return {
    name,
    quantity: normalizeQuantity(item.quantity),
    unit: normalizeNullableString(item.unit),
  };
}

function itemMergeKey(item: ReceiptExtractionItem) {
  return `${item.name.toLowerCase()}::${item.unit?.toLowerCase() ?? ""}`;
}

export function normalizeReceiptExtractionResult(
  result: ReceiptExtractionResult
): ReceiptExtractionResult {
  const merged = new Map<string, ReceiptExtractionItem>();

  for (const item of result.items) {
    const normalized = normalizeItem(item);
    if (!normalized) continue;

    const key = itemMergeKey(normalized);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, normalized);
      continue;
    }

    if (existing.quantity !== null && normalized.quantity !== null) {
      existing.quantity = Number((existing.quantity + normalized.quantity).toFixed(2));
      continue;
    }

    if (existing.quantity === null && normalized.quantity !== null) {
      existing.quantity = normalized.quantity;
    }
  }

  return {
    store: normalizeNullableString(result.store),
    date: normalizeNullableString(result.date),
    items: Array.from(merged.values()),
  };
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isReceiptExtractionItem(value: unknown): value is ReceiptExtractionItem {
  if (!value || typeof value !== "object") return false;
  const item = value as ReceiptExtractionItem;

  return (
    typeof item.name === "string" &&
    isNullableNumber(item.quantity) &&
    isNullableString(item.unit)
  );
}

export function isReceiptExtractionResult(value: unknown): value is ReceiptExtractionResult {
  if (!value || typeof value !== "object") return false;
  const result = value as ReceiptExtractionResult;

  return (
    isNullableString(result.store) &&
    isNullableString(result.date) &&
    Array.isArray(result.items) &&
    result.items.every(isReceiptExtractionItem)
  );
}

export function isAllowedReceiptImageType(type: string) {
  return ALLOWED_RECEIPT_IMAGE_TYPES.includes(
    type as (typeof ALLOWED_RECEIPT_IMAGE_TYPES)[number]
  );
}
