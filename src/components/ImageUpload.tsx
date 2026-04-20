import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUploadProps {
  bucket: "avatars" | "work-assets";
  folder: string;
  onUpload: (url: string) => void;
  currentUrl?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
};

export default function ImageUpload({
  bucket,
  folder,
  onUpload,
  currentUrl,
  className = "",
  size = "md",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSize = bucket === "avatars" ? 2 * 1024 * 1024 : 10 * 1024 * 1024;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { validateUpload } = await import("@/lib/uploadValidation");
    const validationErr = validateUpload(file, { maxBytes: maxSize, allowImages: true });
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (uploadErr) throw uploadErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);

      onUpload(publicUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      setError(err.message || "Upload failed");
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`${sizeMap[size]} rounded-full overflow-hidden border-2 border-dashed border-border flex items-center justify-center cursor-pointer transition-all hover:border-primary relative group`}
        style={{ background: "var(--surface-2)" }}
      >
        {currentUrl ? (
          <>
            <img src={currentUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
          </>
        ) : uploading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {error && (
        <p className="text-[11px] mt-1 text-destructive">{error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
