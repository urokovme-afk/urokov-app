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
  Copy,
} from "lucide-react";
import { downloadFile } from "../lib/download";

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: "image" | "video" | "code" | string;
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copying, setCopying] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>("");

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

  const isCode =
    mediaType === "code" ||
    /\.(html|htm)$/i.test(mediaUrl.split("?")[0].toLowerCase());

  const isVideo =
    mediaType === "video" ||
    /\.(mp4|webm|mov|m4v)$/i.test(mediaUrl.split("?")[0].toLowerCase());

  // Загрузка HTML кода для исполнения в интерактивном окне
  useEffect(() => {
    if (!isOpen || !isCode || !mediaUrl) return;

    let isMounted = true;
    fetch(mediaUrl)
      .then((res) => res.text())
      .then((text) => {
        if (isMounted) setHtmlContent(text);
      })
      .catch((err) => console.error("Code load error in lightbox:", err));

    return () => {
      isMounted = false;
    };
  }, [isOpen, isCode, mediaUrl]);

  if (!isOpen || !mediaUrl) return null;

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

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (copying) return;
    try {
      setCopying(true);
      const text = htmlContent || (await (await fetch(mediaUrl)).text());
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      console.warn("Copy error:", err);
    } finally {
      setCopying(false);
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
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/75 backdrop-blur-md animate-in fade-in duration-200 p-3 sm:p-6 overflow-y-auto"
    >
      {/* Верхняя панель управления */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl mx-auto flex items-center justify-between z-20 pb-3"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200/80 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[11px] font-mono tracking-wider font-semibold text-zinc-700 uppercase">
            {isCode
              ? "ИНТЕРАКТИВНЫЙ 3D КОД"
              : isVideo
              ? "3D АНИМАЦИЯ"
              : "3D РЕНДЕР"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Копировать код (если 3D код) */}
          {isCode && (
            <button
              onClick={handleCopyCode}
              disabled={copying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white border border-zinc-200 text-zinc-700 text-xs font-semibold tracking-wide shadow-sm transition active:scale-95"
              title="Скопировать исходный код"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Код</span>
                </>
              )}
            </button>
          )}

          {isVideo && (
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              className="p-2 rounded-full bg-white/90 border border-zinc-200 text-zinc-700 hover:text-black hover:bg-white shadow-sm transition active:scale-95"
              title={isMuted ? "Включить звук" : "Выключить звук"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-600" />
              )}
            </button>
          )}

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-semibold tracking-wide shadow-md transition active:scale-95"
            title="Скачать файл"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : downloadSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>
              {downloadSuccess
                ? "Скачано"
                : isCode
                ? "Скачать (.html)"
                : "Скачать"}
            </span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/90 border border-zinc-200 text-zinc-500 hover:text-black hover:bg-white shadow-sm transition active:scale-95"
            title="Закрыть (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Центральная медиа-зона */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex-1 flex items-center justify-center my-auto w-full max-w-3xl mx-auto py-2"
      >
        {isCode ? (
          <div className="w-full aspect-[4/3] sm:aspect-[16/10] max-h-[68vh] rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 bg-white">
            {htmlContent ? (
              <iframe
                srcDoc={htmlContent}
                title="3D Interactive Canvas"
                className="w-full h-full border-0 pointer-events-auto"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
                <span className="text-xs font-mono">Запуск 3D сцены...</span>
              </div>
            )}
          </div>
        ) : isVideo ? (
          <video
            src={mediaUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            controls
            className="max-h-[68vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-zinc-200 bg-black"
          />
        ) : (
          <img
            src={mediaUrl}
            alt="3D render"
            className="max-h-[68vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-zinc-200 bg-white"
          />
        )}
      </div>

      {/* Нижняя карточка с описанием (Telegram стиль) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl mx-auto pt-3 z-20"
      >
        <div className="bg-white/95 backdrop-blur-xl border border-zinc-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-2.5 shadow-xl">
          {content ? (
            <p className="text-sm sm:text-[15px] text-zinc-900 leading-relaxed font-normal whitespace-pre-line select-text">
              {content}
            </p>
          ) : (
            <span className="text-xs font-mono text-zinc-400 italic">
              Без описания
            </span>
          )}

          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-xs text-zinc-500">
            {formattedDate && (
              <span className="font-mono text-[11px] tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {formattedDate}
              </span>
            )}
            <button
              onClick={handleDownload}
              className="text-xs font-semibold text-zinc-900 hover:text-cyan-600 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isCode ? "Скачать автономный 3D файл" : "Сохранить оригинал"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
