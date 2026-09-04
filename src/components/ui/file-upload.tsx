"use client";

import { useCallback, useState } from "react";
import { Upload, X, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  bucket?: string;
  folder?: string;
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  label?: string;
}

export function FileUpload({
  accept = "image/*,.pdf",
  maxSizeMB = 5,
  bucket = "public",
  folder = "uploads",
  value,
  onChange,
  className,
  label,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Max ${maxSizeMB}MB.`);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(urlData.publicUrl);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }, [bucket, folder, maxSizeMB, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      {value ? (
        <div className="relative flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <File className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-muted-foreground">
            {value.split("/").pop() || value}
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-accent",
            dragOver && "border-accent bg-accent/5 text-accent",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          <Upload className={cn("h-6 w-6", uploading && "animate-bounce")} />
          <span>{uploading ? "Uploading..." : "Drop file or click to upload"}</span>
          <span className="text-xs text-muted-foreground/70">
            {accept.replace(/,/g, ", ")} up to {maxSizeMB}MB
          </span>
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}
