"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  Film,
  Loader2,
  Check,
  Pin,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface Upload3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export function Upload3DModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: Upload3DModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"video" | "image">("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setErrorMsg("");

    const isVid =
      file.type.startsWith("video/") ||
      /\.(mp4|webm|mov|m4v)$/i.test(file.name);
    setFileType(isVid ? "video" : "image");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Iltimos, avval 3D rasm yoki video faylini tanlang.");
      return;
    }

    try {
      setUploading(true);
      setErrorMsg("");
      setProgressText("Fayl serverga yuklanmoqda...");

      // Fayl nomini tozalash va tayyorlash
      const fileExt = selectedFile.name.split(".").pop()?.toLowerCase() || (fileType === "video" ? "mp4" : "jpg");
      const cleanBase = selectedFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 30);
      const uniqueFileName = `${Date.now()}_3d_${cleanBase}.${fileExt}`;
      const storagePath = `uploads/${uniqueFileName}`;

      // 1. Supabase Storage "media" bucketiga yuklash
      const { error: storageError } = await supabase.storage
        .from("media")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (storageError) {
        throw new Error(`Xotiraga yuklashda xatolik: ${storageError.message}`);
      }

      // 2. Ochiq URL manzilini olish
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(storagePath);

      setProgressText("Ma'lumotlar saqlanmoqda...");

      // 3. Post sarlavhasi va tavsifini jamlash
      const combinedContent = [title.trim(), description.trim()]
        .filter(Boolean)
        .join("\n\n");

      // 4. Supabase 'posts' jadvaliga yozish
      const { error: dbError } = await supabase.from("posts").insert([
        {
          content: combinedContent,
          media_url: publicUrl,
          media_type: fileType,
          is_pinned: isPinned,
          created_at: new Date().toISOString(),
          views: 0,
        },
      ]);

      if (dbError) {
        throw new Error(`Bazada saqlashda xatolik: ${dbError.message}`);
      }

      // Tozalash va yopish
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      setTitle("");
      setDescription("");
      setIsPinned(false);

      onUploadSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setErrorMsg(
        err instanceof Error ? err.message : "Yuklashda kutilmagan xatolik yuz berdi"
      );
    } finally {
      setUploading(false);
      setProgressText("");
    }
  };

  const handleClose = () => {
    if (uploading) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-zinc-800 text-cyan-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Yangi 3D Ish Yuklash
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono">
                Animatsiya yoki render
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form
          onSubmit={handlePublish}
          className="p-5 overflow-y-auto flex flex-col gap-4"
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          {!previewUrl ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition text-center group"
            >
              <div className="p-3.5 rounded-full bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition">
                <Film className="w-6 h-6 text-zinc-400 group-hover:text-cyan-400 transition" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-200">
                  3D video yoki tasvirni tanlang yoki bu yerga tashlang
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  MP4, WEBM, MOV, PNG, JPG, WEBP (Cheklovsiz sifat)
                </span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video flex items-center justify-center">
              {fileType === "video" ? (
                <video
                  src={previewUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )}

              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-zinc-300 hover:text-white border border-white/10 transition"
                title="Faylni almashtirish"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Sarlavha input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              Sarlavha (Title)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: Kinetic Spiral Loop #01"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition"
            />
          </div>

          {/* Tavsif va teglari */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              Tavsif yoki teglar (Description & Tags)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="#Blender #Octane #Loop #Spiral"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition resize-none"
            />
          </div>

          {/* Pinned toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-500 bg-zinc-900 border-zinc-700"
            />
            <div className="flex items-center gap-1.5 text-xs text-zinc-300">
              <Pin className="w-3 h-3 text-cyan-400 rotate-45" />
              <span>Bosh sahifa tepasida mahkamlash (Pin to top)</span>
            </div>
          </label>

          {/* Submit action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-wide transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>{progressText || "Yuklanmoqda..."}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>Galereyaga Chop Etish</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
