"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ALLOWED_RECEIPT_IMAGE_TYPES,
  MAX_RECEIPT_UPLOAD_BYTES,
} from "@/lib/receipt/schema";

type Props = {
  isSubmitting: boolean;
  error: string | null;
  onExtract: (file: File) => Promise<void>;
};

const ACCEPT_VALUE = ALLOWED_RECEIPT_IMAGE_TYPES.join(",");

function formatFileSize(size: number) {
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReceiptUpload({ isSubmitting, error, onExtract }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(nextFile: File | null) {
    setLocalError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (!nextFile) {
      setSelectedFile(null);
      return;
    }

    if (!ALLOWED_RECEIPT_IMAGE_TYPES.includes(nextFile.type as (typeof ALLOWED_RECEIPT_IMAGE_TYPES)[number])) {
      setSelectedFile(null);
      setLocalError("Choose a JPG, PNG, or WEBP receipt image.");
      return;
    }

    if (nextFile.size > MAX_RECEIPT_UPLOAD_BYTES) {
      setSelectedFile(null);
      setLocalError("Receipt image is too large. Use an image under 8 MB.");
      return;
    }

    setSelectedFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile || isSubmitting) return;
    setLocalError(null);
    await onExtract(selectedFile);
  }

  const activeError = localError || error;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block rounded-2xl border border-dashed border-[var(--brand-red)]/35 bg-red-50/30 p-5 text-sm text-[var(--ink)]">
        <span className="block text-base font-bold text-[var(--brand-red-strong)]">
          Upload a receipt image
        </span>
        <span className="mt-1 block text-sm text-[var(--ink-soft)]">
          JPG, PNG, or WEBP. Clear, front-facing receipt photos work best.
        </span>
        <input
          type="file"
          accept={ACCEPT_VALUE}
          className="mt-4 block w-full cursor-pointer text-sm text-[var(--ink-soft)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--brand-red)] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[var(--brand-red-strong)]"
          onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
          disabled={isSubmitting}
        />
      </label>

      {selectedFile ? (
        <div className="grid gap-4 rounded-2xl border border-[var(--border-soft)] bg-white p-4 md:grid-cols-[180px_1fr]">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Receipt preview"
              className="h-40 w-full rounded-xl border border-[var(--border-soft)] object-cover"
              width={320}
              height={320}
              unoptimized
            />
          ) : null}

          <div className="space-y-2 text-sm text-[var(--ink-soft)]">
            <p className="font-semibold text-[var(--ink)]">{selectedFile.name}</p>
            <p>Type: {selectedFile.type}</p>
            <p>Size: {formatFileSize(selectedFile.size)}</p>
          </div>
        </div>
      ) : null}

      {activeError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {activeError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!selectedFile || isSubmitting}
        className="rounded-lg bg-[var(--brand-green)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-green-strong)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Extracting receipt..." : "Extract items"}
      </button>
    </form>
  );
}
