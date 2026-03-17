import "server-only";

import {
  isReceiptExtractionResult,
  normalizeReceiptExtractionResult,
  RECEIPT_EXTRACTION_JSON_SCHEMA,
} from "@/lib/receipt/schema";
import type { ReceiptExtractionResult } from "@/types/receipt";

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_VISION_MODEL = "qwen2.5vl:7b";

type ExtractReceiptInput = {
  fileBytes: ArrayBuffer;
  fileName: string;
};

type OllamaTagsResponse = {
  models?: Array<{
    name?: string;
    model?: string;
  }>;
  error?: string;
};

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
  error?: string;
};

function getOllamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_BASE_URL).replace(/\/+$/, "");
}

function getOllamaVisionModel() {
  return process.env.OLLAMA_VISION_MODEL?.trim() || DEFAULT_OLLAMA_VISION_MODEL;
}

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

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch {
    throw new Error(`Ollama is not running on ${getOllamaBaseUrl()}`);
  }

  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || `Ollama request failed with status ${response.status}.`);
  }

  return payload;
}

async function ensureModelAvailable(baseUrl: string, model: string) {
  const payload = await fetchJson<OllamaTagsResponse>(`${baseUrl}/api/tags`);
  const availableModels = new Set(
    (payload.models ?? []).flatMap((item) =>
      [item.name, item.model].filter((value): value is string => Boolean(value))
    )
  );

  if (!availableModels.has(model)) {
    throw new Error(`Model ${model} is not available. Run: ollama pull ${model}`);
  }
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
  const baseUrl = getOllamaBaseUrl();
  const model = getOllamaVisionModel();

  await ensureModelAvailable(baseUrl, model);

  const payload = await fetchJson<OllamaChatResponse>(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      format: RECEIPT_EXTRACTION_JSON_SCHEMA,
      options: {
        temperature: 0,
      },
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
    }),
  });

  const content = payload.message?.content?.trim();
  if (!content) {
    throw new Error("Ollama returned an empty response for receipt extraction.");
  }

  return parseReceiptContent(content);
}
