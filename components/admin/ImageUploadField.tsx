"use client";

import { ImageIcon, RotateCcw, Upload } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { FieldError, inputClasses, labelClasses } from "@/components/ui/Form";
import { cn } from "@/lib/utils";

type UploadFolder = "menu-items" | "gift-cards";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxSize = 5 * 1024 * 1024;

export function ImageUploadField({
  label = "Image URL or path",
  name = "imageUrl",
  defaultValue = "",
  folder,
  nameHint,
  errors,
  disabled = false
}: {
  label?: string;
  name?: string;
  defaultValue?: string | null;
  folder: UploadFolder;
  nameHint?: string;
  errors?: string[];
  disabled?: boolean;
}) {
  const id = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(defaultValue ?? "");
  const [previewUrl, setPreviewUrl] = useState(defaultValue ?? "");
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accept = useMemo(() => acceptedTypes.join(","), []);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  function selectFile(file: File) {
    setError(null);
    setMessage(null);

    if (!acceptedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and WebP images are supported.");
      return;
    }

    if (file.size > maxSize) {
      setError("Image is too large. Maximum size is 5 MB.");
      return;
    }

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setPreviewUrl(objectUrl);
    setMessage("Image selected. It will be uploaded when you save the form.");
  }

  function resetImage() {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setLocalPreviewUrl(null);
    setImageUrl(defaultValue ?? "");
    setPreviewUrl(defaultValue ?? "");
    setError(null);
    setMessage("Selected image cleared.");
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="imageUploadFolder" value={folder} />
      <input type="hidden" name="imageUploadNameHint" value={nameHint ?? ""} />
      <div>
        <label className={labelClasses} htmlFor={`${id}-url`}>
          {label}
        </label>
        <input
          className={inputClasses}
          id={`${id}-url`}
          name={name}
          value={imageUrl}
          readOnly={disabled}
          onChange={(event) => {
            if (disabled) {
              return;
            }
            setImageUrl(event.target.value);
            setPreviewUrl(event.target.value);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            if (localPreviewUrl) {
              URL.revokeObjectURL(localPreviewUrl);
              setLocalPreviewUrl(null);
            }
            setMessage(null);
            setError(null);
          }}
          placeholder="/images/menu/Caffe Latte.jpg or https://..."
        />
        <FieldError messages={errors} />
      </div>

      <div className="grid gap-4 md:grid-cols-[10rem_1fr]">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
          {previewUrl ? (
            <FallbackImage
              src={previewUrl}
              alt="Selected image preview"
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-primary">
              <ImageIcon size={28} />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          {!disabled && (
            <label
              className={cn(
                "focus-within:ring-primary inline-flex w-fit cursor-pointer items-center justify-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-3 font-mono text-[11px] font-bold uppercase text-primary transition hover:bg-primary/15 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-background"
              )}
            >
              <Upload size={16} />
              Select image
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                name="imageFile"
                accept={accept}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    selectFile(file);
                  }
                }}
              />
            </label>
          )}
          <p className="text-xs leading-5 text-on-surface-variant">
            {disabled
              ? "Image changes are locked until edit mode is enabled."
              : "JPG, PNG, or WebP. Maximum 5 MB. Selected files are uploaded only when you save; pasted local paths still work."}
          </p>
          {!disabled && (imageUrl || previewUrl) && (
            <button
              type="button"
              className="focus-ring inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-on-surface-variant hover:text-primary"
              onClick={resetImage}
            >
              <RotateCcw size={14} />
              Reset image
            </button>
          )}
          {message && <p className="text-sm text-primary">{message}</p>}
          {error && <p className="text-sm text-red-200">{error}</p>}
        </div>
      </div>
    </div>
  );
}
