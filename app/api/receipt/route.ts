import { NextResponse } from "next/server";
import { extractReceiptFromImage } from "@/lib/receipt/ollama";
import {
  isAllowedReceiptImageType,
  MAX_RECEIPT_UPLOAD_BYTES,
} from "@/lib/receipt/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const uploaded = formData.get("receipt");

  if (!(uploaded instanceof File)) {
    return NextResponse.json(
      { error: "Upload a receipt image before starting extraction." },
      { status: 400 }
    );
  }

  if (!isAllowedReceiptImageType(uploaded.type)) {
    return NextResponse.json(
      { error: "Receipt upload must be a JPG, PNG, or WEBP image." },
      { status: 400 }
    );
  }

  if (uploaded.size === 0) {
    return NextResponse.json(
      { error: "The selected file is empty. Choose a valid receipt image." },
      { status: 400 }
    );
  }

  if (uploaded.size > MAX_RECEIPT_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Receipt image is too large. Use an image under 8 MB." },
      { status: 400 }
    );
  }

  try {
    const extracted = await extractReceiptFromImage({
      fileBytes: await uploaded.arrayBuffer(),
      fileName: uploaded.name,
    });

    return NextResponse.json(extracted);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Receipt extraction failed unexpectedly.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
