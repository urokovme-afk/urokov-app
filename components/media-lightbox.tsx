"use client";

import { useEffect, useState } from "react";
import {
  X,
  Download,
  Volume2,
  VolumeX,
  Check,
  Loader2,
  Calendar,
} from "lucide-react";
import { downloadFile } from "../lib/download";

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: "image" | "video" | string;
  content?: string;
  createdAt?: string;
}

export function MediaLightbox({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  content,
  createdAt,
}: MediaLightboxProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mediaUrl) return null;

  const isVideo =
    mediaType === "video" ||
    /\.(mp4|webm|mov|m4v)$/i.test(mediaUrl.split("?")[0].toLowerCase());

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    const suggestedName = content ? content.slice(0, 30) : "urokov-3d";
    const success = await downloadFile(mediaUrl, suggestedName);
    setDownloading(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200 p-3 sm:p-6 overflow-y-auto"
    >
      {/* Top action bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl mx-auto flex items-center justify-between z-20 pb-3"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
            {isVideo ? "3D MOTION LOOP" : "3D STILL RENDER"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isVideo && (
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              className="p-2 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition active:scale-95"
              title={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
            </button>
          )}

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-white text-xs font-medium tracking-wide transition active:scale-95"
            title="Yuklab olish"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : downloadSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{downloadSuccess ? "Yuklandi" : "Yuklab olish"}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95"
            title="Yopish (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Media View (Large screen) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex-1 flex items-center justify-center my-auto w-full max-w-3xl mx-auto py-2"
      >
        {isVideo ? (
          <video
            src={mediaUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            controls
            className="max-h-[68vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-zinc-900 bg-black"
          />
        ) : (
          <img
            src={mediaUrl}
            alt="3D render"
            className="max-h-[68vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-zinc-900 bg-black"
          />
        )}
      </div>

      {/* Bottom info section (Telegram style: matn faqat shu yerda chiqadi) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl mx-auto pt-3 z-20"
      >
        <div className="bg-zinc-950/85 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-2.5 shadow-2xl">
          {content ? (
            <p className="text-sm sm:text-[15px] text-zinc-200 leading-relaxed font-normal whitespace-pre-line select-text">
              {content}
            </p>
          ) : (
            <span className="text-xs font-mono text-zinc-500 italic">
              Izoh kiritilmagan
            </span>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs text-zinc-500">
            {formattedDate && (
              <span className="font-mono text-[11px] tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                {formattedDate}
              </span>
            )}
            <button
              onClick={handleDownload}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition"
            >
              <Download className="w-3 h-3" />
              <span>Originalni saqlash</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
