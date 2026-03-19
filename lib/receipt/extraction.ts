import "server-only";

import { parseJsonObjectFromText } from "@/lib/ai/json";
import {
  getOpenRouterExtractionModel,
  runOpenRouterChat,
} from "@/lib/ai/openrouter";
import { extractTextWithOcrSpace } from "@/lib/ocr/ocrSpace";
import {
  isReceiptExtractionResult,
  normalizeReceiptExtractionResult,
  RECEIPT_EXTRACTION_JSON_SCHEMA,
} from "@/lib/receipt/schema";
import type { ReceiptExtractionResult } from "@/types/receipt";

type ExtractReceiptInput = {
  fileBytes: ArrayBuffer;
  fileName: string;
  mimeType: string;
};

const MAX_OCR_TEXT_CHARS = 12000;

function buildReceiptExtractionPrompt(rawText: string) {
  return [
    "Convert this OCR text from a grocery receipt into strict JSON.",
    "Return only grocery-like purchased items.",
    "Ignore and remove junk lines such as totals, subtotal, taxes, payment/card details, loyalty lines, cashier/footer/header metadata, transaction ids, phone numbers, and addresses.",
    "Normalize product names into short user-friendly grocery names.",
    "Set quantity and unit only when clearly present. Otherwise return null.",
    "Do not include markdown, comments, or extra keys.",
    `Output must match this JSON schema exactly: ${JSON.stringify(RECEIPT_EXTRACTION_JSON_SCHEMA)}.`,
    "OCR text:",
    rawText,
  ].join("\n\n");
}

function parseReceiptContent(content: string) {
  const parsed = parseJsonObjectFromText(content, "OpenRouter");
  if (!isReceiptExtractionResult(parsed)) {
    throw new Error("Receipt extraction returned JSON in an unexpected format.");
  }

  return normalizeReceiptExtractionResult(parsed);
}

export async function extractReceiptFromImage({
  fileBytes,
  fileName,
  mimeType,
}: ExtractReceiptInput): Promise<ReceiptExtractionResult> {
  const rawText = await extractTextWithOcrSpace({
    fileBytes,
    fileName,
    mimeType,
  });
  const promptText = rawText.slice(0, MAX_OCR_TEXT_CHARS);

  const content = await runOpenRouterChat({
    model: getOpenRouterExtractionModel(),
    temperature: 0,
    responseFormat: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You extract groceries from OCR text and must return strict JSON only.",
      },
      {
        role: "user",
        content: buildReceiptExtractionPrompt(promptText),
      },
    ],
  });

  return parseReceiptContent(content);
}
