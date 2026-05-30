import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function FlickCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const { validateUpload } = await import("@/lib/uploadValidation");
    const err = validateUpload(f, { maxBytes: 20 * 1024 * 1024, allowImages: true });
    if (err) { toast.error(err); return; }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    e.target.value = "";
  };

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setNaturalSize(null);
  };

  const handlePublish = async () => {
    if (!file || !user) { toast.error(file ? "Sign in to post" : "Pick an image first"); return; }
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-z0-9.]/gi, "_");
      const path = `${user.id}/${Date.now()}-${safeName}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("post-images")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(uploadData.path);
      const imageUrl = urlData?.publicUrl;
      if (!imageUrl) throw new Error("Could not get public URL");

      const { error: insertErr } = await (supabase.from("flicks" as any).insert({
        author_id: user.id,
        image_url: imageUrl,
        width: naturalSize?.w ?? null,
        height: naturalSize?.h ?? null,
        alt_text: altText.trim() || null,
      }) as any);
      if (insertErr) throw insertErr;

      toast.success("Flick posted!");
      navigate("/app/flicks");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--bg-page)",
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        margin: "0 auto",
        padding: "16px 16px 32px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="cursor-pointer"
          style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface-2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft style={{ width: 16, height: 16, color: "var(--text-1)" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", fontFamily: "'Bricolage Grotesque', sans-serif", flex: 1 }}>
          New Flick
        </h1>
        <button
          type="button"
          onClick={handlePublish}
          disabled={!file || uploading}
          className="cursor-pointer active:scale-[0.97]"
          style={{
            height: 36, padding: "0 20px", borderRadius: 999,
            background: file && !uploading ? "#FF5A1F" : "var(--surface-2)",
            color: file && !uploading ? "#fff" : "var(--text-3)",
            border: "none", fontSize: 13, fontWeight: 600,
            transition: "all 200ms",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {uploading && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
          {uploading ? "Posting…" : "Post"}
        </button>
      </div>

      {/* Upload area */}
      {!preview ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer active:scale-[0.98]"
          style={{
            flex: 1,
            minHeight: 320,
            borderRadius: 20,
            border: "2px dashed var(--hairline)",
            background: "var(--surface-2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            transition: "border-color 150ms",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#FF5A1F")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--hairline)")}
        >
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,90,31,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImagePlus style={{ width: 32, height: 32, color: "#FF5A1F" }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>Pick an image</p>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>JPEG · PNG · WebP · up to 20 MB</p>
        </button>
      ) : (
        <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: "#000" }}>
          <img
            src={preview}
            alt="Preview"
            onLoad={onImgLoad}
            style={{ width: "100%", maxHeight: "60dvh", objectFit: "contain", display: "block" }}
          />
          <button
            type="button"
            onClick={clearFile}
            className="cursor-pointer"
            style={{
              position: "absolute", top: 10, right: 10,
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(0,0,0,0.55)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X style={{ width: 16, height: 16, color: "#fff" }} />
          </button>
        </div>
      )}

      {/* Alt text */}
      {preview && (
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Alt text (optional)
          </label>
          <input
            type="text"
            value={altText}
            onChange={e => setAltText(e.target.value)}
            placeholder="Describe this image for accessibility"
            maxLength={250}
            style={{
              marginTop: 6,
              width: "100%",
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid var(--hairline)",
              background: "var(--input-bg)",
              color: "var(--text-1)",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Change image CTA when preview shown */}
      {preview && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer"
          style={{ marginTop: 12, padding: "8px 0", fontSize: 13, color: "var(--text-3)", background: "none", border: "none", textDecoration: "underline" }}
        >
          Change image
        </button>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
