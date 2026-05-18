'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_BYTES = 20 * 1024 * 1024;

export interface CapturedPhoto {
  blob: Blob;
  sizeBytes: number;
}

interface Props {
  onChange: (photo: CapturedPhoto | null) => void;
  disabled?: boolean;
}

export default function PhotoCapture({ onChange, disabled = false }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const setPreview = useCallback(
    (next: string | null) => {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return next;
      });
    },
    [],
  );

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.type.startsWith('image/')) {
        setError('Pick an image file.');
        return;
      }
      if (file.size > MAX_BYTES) {
        setError('Photo is larger than 20 MB. Pick a smaller one.');
        return;
      }
      setPreview(URL.createObjectURL(file));
      onChange({ blob: file, sizeBytes: file.size });
    },
    [onChange, setPreview],
  );

  const handleDiscard = useCallback(() => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onChange(null);
  }, [onChange, setPreview]);

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
        id="photo-capture-input"
      />

      {previewUrl ? (
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Captured photo preview"
            className="max-h-72 w-full rounded-xl object-contain"
          />
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor="photo-capture-input"
              className="cursor-pointer rounded-full border border-violet-300 px-4 py-2 text-sm text-violet-800 hover:bg-violet-50"
              aria-disabled={disabled}
            >
              Replace
            </label>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={disabled}
              className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Discard
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor="photo-capture-input"
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-200"
          aria-disabled={disabled}
        >
          <span aria-hidden>📷</span>
          Add a photo
        </label>
      )}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
