import "server-only";

import {
  isReceiptExtractionResult,
  normalizeReceiptExtractionResult,
  RECEIPT_EXTRACTION_JSON_SCHEMA,
} from "@/lib/receipt/schema";
import { getOllamaVisionModel, runOllamaChat } from "@/lib/ollama/client";
import type { ReceiptExtractionResult } from "@/types/receipt";

type ExtractReceiptInput = {
  fileBytes: ArrayBuffer;
  fileName: string;
};

function receiptExtractionPrompt(schema: string, fileName: string) {
  return [
    "Analyze this grocery receipt image and return JSON only.",
    "Extract only grocery-like purchased items.",
    "Ignore totals, taxes, payment info, loyalty numbers, addresses, cashier info, and metadata.",
    "If quantity or unit is not reasonably visible, return null for that field.",
    "Use shopper-friendly grocery names.",
    "Do not wrap the response in markdown.",
    `Return data that matches this schema exactly: ${schema}`,
    `Source filename: ${fileName}`,
  ].join(" ");
}

function parseReceiptContent(content: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Ollama returned invalid JSON for receipt extraction.");
  }

  if (!isReceiptExtractionResult(parsed)) {
    throw new Error("Ollama returned JSON in an unexpected receipt shape.");
  }

  return normalizeReceiptExtractionResult(parsed);
}

export async function extractReceiptFromImage({
  fileBytes,
  fileName,
}: ExtractReceiptInput): Promise<ReceiptExtractionResult> {
  const model = getOllamaVisionModel();
  const content = await runOllamaChat({
    model,
    format: RECEIPT_EXTRACTION_JSON_SCHEMA,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: receiptExtractionPrompt(
          JSON.stringify(RECEIPT_EXTRACTION_JSON_SCHEMA),
          fileName
        ),
        images: [Buffer.from(fileBytes).toString("base64")],
      },
    ],
  });

  return parseReceiptContent(content);
}
