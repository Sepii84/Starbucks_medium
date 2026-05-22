"use client";

import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type FallbackImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
};

export function FallbackImage({
  src,
  alt,
  className,
  fallbackClassName
}: FallbackImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-primary/25 via-surface-container to-secondary/20 text-primary",
          className,
          fallbackClassName
        )}
        role="img"
        aria-label={alt}
      >
        <ImageIcon size={32} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
