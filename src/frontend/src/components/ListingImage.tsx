import { useEffect, useState } from "react";
import { getAnonymousStorageClient } from "../hooks/useStorageClient";

interface ListingImageProps {
  imageUrl: string;
  alt: string;
  className?: string;
}

export function ListingImage({ imageUrl, alt, className }: ListingImageProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setResolvedUrl(null);
      return;
    }
    if (imageUrl.startsWith("sha256:")) {
      let cancelled = false;
      (async () => {
        try {
          const client = await getAnonymousStorageClient();
          const url = await client.getDirectURL(imageUrl);
          if (!cancelled) setResolvedUrl(url);
        } catch {
          if (!cancelled) setFailed(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    setResolvedUrl(imageUrl || null);
  }, [imageUrl]);

  if (
    !imageUrl ||
    failed ||
    (!resolvedUrl && !imageUrl.startsWith("sha256:"))
  ) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className ?? ""}`}
      >
        <svg
          className="h-10 w-10 text-muted-foreground/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <title>No image</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  if (imageUrl.startsWith("sha256:") && !resolvedUrl) {
    // Loading skeleton
    return (
      <div
        className={`animate-pulse bg-muted ${className ?? ""}`}
        aria-busy="true"
      />
    );
  }

  return (
    <img
      src={resolvedUrl!}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
