import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStorageClient } from "../hooks/useStorageClient";
import { getAnonymousStorageClient } from "../hooks/useStorageClient";

interface ImageUploadProps {
  onUploadComplete: (hash: string) => void;
  currentImageUrl?: string;
  disabled?: boolean;
}

export function ImageUpload({
  onUploadComplete,
  currentImageUrl,
  disabled,
}: ImageUploadProps) {
  const storageClient = useStorageClient();
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Resolve existing image hash to display URL
  useEffect(() => {
    if (!currentImageUrl) {
      setPreview(null);
      return;
    }
    if (currentImageUrl.startsWith("sha256:")) {
      let cancelled = false;
      (async () => {
        try {
          const client = await getAnonymousStorageClient();
          const url = await client.getDirectURL(currentImageUrl);
          if (!cancelled) setPreview(url);
        } catch {
          if (!cancelled) setPreview(null);
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    if (currentImageUrl) {
      setPreview(currentImageUrl);
    }
  }, [currentImageUrl]);

  // Revoke object URLs on cleanup
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPEG, PNG, WebP, etc.)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be under 10 MB");
        return;
      }

      setError(null);

      // Show local preview immediately
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const localUrl = URL.createObjectURL(file);
      objectUrlRef.current = localUrl;
      setPreview(localUrl);

      if (!storageClient) {
        setError("Storage not available. Please log in first.");
        return;
      }

      setIsUploading(true);
      setProgress(0);

      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { hash } = await storageClient.putFile(bytes, (pct) => {
          setProgress(pct);
        });
        setProgress(100);
        onUploadComplete(hash);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [storageClient, onUploadComplete],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled || isUploading) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, isUploading, handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input value so same file can be re-selected
      e.target.value = "";
    },
    [handleFile],
  );

  const clearImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreview(null);
    setError(null);
    setProgress(0);
    onUploadComplete("");
  };

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <button
        type="button"
        data-ocid="sell.dropzone"
        className={cn(
          "relative w-full rounded-lg border-2 border-dashed transition-colors cursor-pointer text-left",
          "min-h-[180px] flex flex-col items-center justify-center gap-3 p-6",
          isDragOver && !disabled
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/60 hover:bg-muted/40",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          preview && "border-solid border-border",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        disabled={disabled}
        aria-label="Upload image"
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 max-w-full rounded-md object-contain"
            />
            {!isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background border border-border shadow-sm transition-colors"
                aria-label="Remove image"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            )}
          </>
        ) : (
          <>
            <div className="rounded-full bg-primary/10 p-3">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drop an image here, or{" "}
                <span className="text-primary underline underline-offset-2">
                  browse files
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP · max 10 MB
              </p>
            </div>
          </>
        )}

        {/* Uploading overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 rounded-lg gap-2">
            <Upload className="h-6 w-6 text-primary animate-bounce" />
            <p className="text-sm font-medium text-foreground">Uploading…</p>
          </div>
        )}
      </button>

      {/* Progress bar */}
      {isUploading && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-right">
            {progress}%
          </p>
        </div>
      )}

      {/* Upload button (secondary action) */}
      {!preview && !isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid="sell.upload_button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose image
        </Button>
      )}

      {/* Error */}
      {error && (
        <p
          className="text-xs text-destructive"
          data-ocid="sell.upload.error_state"
        >
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleChange}
        disabled={disabled || isUploading}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
