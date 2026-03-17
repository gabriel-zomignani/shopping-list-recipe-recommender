import "server-only";

export const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
export const DEFAULT_OLLAMA_VISION_MODEL = "qwen2.5vl:7b";
export const DEFAULT_OLLAMA_RECIPE_MODEL = DEFAULT_OLLAMA_VISION_MODEL;

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

type OllamaChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[];
};

type RunOllamaChatInput = {
  model: string;
  messages: OllamaChatMessage[];
  format?: Record<string, unknown> | "json";
  temperature?: number;
};

export function getOllamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_BASE_URL).replace(/\/+$/, "");
}

export function getOllamaVisionModel() {
  return process.env.OLLAMA_VISION_MODEL?.trim() || DEFAULT_OLLAMA_VISION_MODEL;
}

export function getOllamaRecipeModel() {
  return process.env.OLLAMA_RECIPE_MODEL?.trim() || DEFAULT_OLLAMA_RECIPE_MODEL;
}

async function fetchOllamaJson<T>(url: string, init?: RequestInit): Promise<T> {
  const baseUrl = getOllamaBaseUrl();
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch {
    throw new Error(`Ollama is not running on ${baseUrl}`);
  }

  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || `Ollama request failed with status ${response.status}.`);
  }

  return payload;
}

export async function ensureOllamaModelAvailable(model: string) {
  const payload = await fetchOllamaJson<OllamaTagsResponse>(`${getOllamaBaseUrl()}/api/tags`);
  const availableModels = new Set(
    (payload.models ?? []).flatMap((item) =>
      [item.name, item.model].filter((value): value is string => Boolean(value))
    )
  );

  if (!availableModels.has(model)) {
    throw new Error(`Model ${model} is not available. Run: ollama pull ${model}`);
  }
}

export async function runOllamaChat({
  model,
  messages,
  format,
  temperature = 0,
}: RunOllamaChatInput) {
  await ensureOllamaModelAvailable(model);

  const payload = await fetchOllamaJson<OllamaChatResponse>(`${getOllamaBaseUrl()}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      format,
      options: {
        temperature,
      },
      messages,
    }),
  });

  const content = payload.message?.content?.trim();
  if (!content) {
    throw new Error("Ollama returned an empty response.");
  }

  return content;
}
