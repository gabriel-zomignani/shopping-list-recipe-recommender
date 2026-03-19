export const ALLOWED_RECEIPT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_RECEIPT_UPLOAD_BYTES = 8 * 1024 * 1024;

export function isAllowedReceiptImageType(type: string) {
  return ALLOWED_RECEIPT_IMAGE_TYPES.includes(
    type as (typeof ALLOWED_RECEIPT_IMAGE_TYPES)[number]
  );
}
