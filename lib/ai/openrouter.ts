import "server-only";

export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_OPENROUTER_MODEL_EXTRACTION = "openrouter/free";
export const DEFAULT_OPENROUTER_MODEL_RECIPES = "openrouter/free";

type OpenRouterRole = "system" | "user" | "assistant";

type OpenRouterMessage = {
  role: OpenRouterRole;
  content: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            text?: string;
          }>;
    };
  }>;
  error?:
    | string
    | {
        message?: string;
      };
};

type RunOpenRouterChatInput = {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  responseFormat?: { type: "json_object" };
};

function getRequiredApiKey() {
  const value = process.env.OPENROUTER_API_KEY?.trim();
  if (!value) {
    throw new Error("The server is missing OPENROUTER_API_KEY.");
  }
  return value;
}

function readContentText(
  content: OpenRouterResponse["choices"] extends Array<infer T>
    ? T extends { message?: { content?: infer C } }
      ? C
      : unknown
    : unknown
) {
  if (typeof content === "string") {
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!Array.isArray(content)) return null;

  const parts = content
    .map((part) => (typeof part?.text === "string" ? part.text.trim() : ""))
    .filter((part) => part.length > 0);

  if (parts.length === 0) return null;
  return parts.join("\n");
}

async function readErrorMessage(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as OpenRouterResponse;
  const payloadError =
    typeof payload.error === "string" ? payload.error : payload.error?.message;

  return payloadError || `OpenRouter request failed with status ${response.status}.`;
}

export function getOpenRouterBaseUrl() {
  return (process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_OPENROUTER_BASE_URL).replace(
    /\/+$/,
    ""
  );
}

export function getOpenRouterExtractionModel() {
  return process.env.OPENROUTER_MODEL_EXTRACTION?.trim() || DEFAULT_OPENROUTER_MODEL_EXTRACTION;
}

export function getOpenRouterRecipesModel() {
  return process.env.OPENROUTER_MODEL_RECIPES?.trim() || DEFAULT_OPENROUTER_MODEL_RECIPES;
}

export async function runOpenRouterChat({
  model,
  messages,
  temperature = 0,
  responseFormat,
}: RunOpenRouterChatInput) {
  const response = await fetch(`${getOpenRouterBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getRequiredApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: responseFormat,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json().catch(() => ({}))) as OpenRouterResponse;
  const content = readContentText(payload.choices?.[0]?.message?.content);

  if (!content) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return content;
}
