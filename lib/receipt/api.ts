import { buildApiUrl } from "@/lib/api/backend";
import type { ReceiptExtractionResult } from "@/types/receipt";

type ApiErrorPayload = {
  detail?: string | Array<{ msg?: string }>;
  error?: string;
};

function getApiErrorMessage(payload: ApiErrorPayload | ReceiptExtractionResult) {
  if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if ("detail" in payload) {
    const detail = payload.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail.trim();
    }

    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (first && typeof first.msg === "string" && first.msg.trim()) {
        return first.msg.trim();
      }
    }
  }

  return "Receipt extraction failed.";
}

function isReceiptExtractionResult(
  value: ReceiptExtractionResult | ApiErrorPayload
): value is ReceiptExtractionResult {
  return (
    "items" in value &&
    Array.isArray(value.items) &&
    ("store" in value || "date" in value)
  );
}

export async function requestReceiptExtraction(
  file: File
): Promise<ReceiptExtractionResult> {
  const formData = new FormData();
  formData.set("receipt", file);

  let response: Response;
  try {
    response = await fetch(buildApiUrl("/receipt/extract"), {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("Could not reach the backend receipt service. Check if FastAPI is running.");
  }

  const payload = (await response.json()) as ReceiptExtractionResult | ApiErrorPayload;

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload));
  }

  if (!isReceiptExtractionResult(payload)) {
    throw new Error("Receipt extraction returned an unexpected response.");
  }

  return payload;
}
