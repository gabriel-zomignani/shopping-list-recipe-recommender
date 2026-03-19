import "server-only";

const OCR_SPACE_API_URL = "https://api.ocr.space/parse/image";

type OcrSpaceParsedResult = {
  ParsedText?: string;
  ErrorMessage?: string | string[];
};

type OcrSpaceResponse = {
  OCRExitCode?: number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
  ParsedResults?: OcrSpaceParsedResult[];
};

type ExtractTextInput = {
  fileBytes: ArrayBuffer;
  fileName: string;
  mimeType: string;
};

function getRequiredOcrSpaceKey() {
  const value = process.env.OCR_SPACE_API_KEY?.trim();
  if (!value) {
    throw new Error("The server is missing OCR_SPACE_API_KEY.");
  }
  return value;
}

function normalizeErrorList(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value.filter(Boolean).join(" ") : value;
}

export async function extractTextWithOcrSpace({
  fileBytes,
  fileName,
  mimeType,
}: ExtractTextInput) {
  const formData = new FormData();
  formData.set("isOverlayRequired", "false");
  formData.set("OCREngine", "2");
  formData.set("language", "eng");
  formData.set("scale", "true");
  formData.set("file", new Blob([fileBytes], { type: mimeType }), fileName);

  const response = await fetch(OCR_SPACE_API_URL, {
    method: "POST",
    headers: {
      apikey: getRequiredOcrSpaceKey(),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("OCR service is unavailable right now. Please try again shortly.");
  }

  const payload = (await response.json().catch(() => ({}))) as OcrSpaceResponse;
  const apiError = normalizeErrorList(payload.ErrorMessage);
  const details = payload.ErrorDetails?.trim() ?? "";

  if (payload.IsErroredOnProcessing || payload.OCRExitCode !== 1) {
    const message = [apiError, details].filter(Boolean).join(" ").trim();
    throw new Error(
      message || "Could not read this receipt image. Try a clearer, front-facing photo."
    );
  }

  const parsedText = (payload.ParsedResults ?? [])
    .map((result) => result.ParsedText?.trim() ?? "")
    .filter((text) => text.length > 0)
    .join("\n")
    .trim();

  if (!parsedText) {
    throw new Error("No readable text was found on this receipt image.");
  }

  return parsedText;
}
