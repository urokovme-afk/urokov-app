"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pin,
  Trash2,
  Loader2,
  Code2,
} from "lucide-react";

export interface WorkPost {
  id: number;
  content: string;
  media_url: string;
  media_type: string;
  is_pinned?: boolean;
  created_at: string;
  views?: number;
}

interface WorkCardProps {
  post: WorkPost;
  isAdmin: boolean;
  onDelete?: (id: number) => void;
  onTogglePin?: (id: number, currentPinned: boolean) => void;
  onOpenLightbox: (post: WorkPost) => void;
}

// Глобальный кэш текста 3D кода в памяти
const codeCache = new Map<string, string>();

export function WorkCard({
  post,
  isAdmin,
  onDelete,
  onTogglePin,
  onOpenLightbox,
}: WorkCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>(() => {
    return codeCache.get(post.media_url) || "";
  });
  const [codeLoading, setCodeLoading] = useState(!codeCache.has(post.media_url));

  const isCode =
    post.media_type === "code" ||
    /\.(html|htm)$/i.test((post.media_url || "").split("?")[0].toLowerCase());

  const isVideo =
    post.media_type === "video" ||
    /\.(mp4|webm|mov|m4v)$/i.test((post.media_url || "").split("?")[0].toLowerCase());

  // Загрузка HTML кода для исполнения в iframe через srcDoc
  useEffect(() => {
    if (!isCode || !post.media_url) return;

    if (codeCache.has(post.media_url)) {
      return;
    }

    let isMounted = true;
    fetch(post.media_url)
      .then((res) => res.text())
      .then((text) => {
        codeCache.set(post.media_url, text);
        if (isMounted) {
          setHtmlContent(text);
          setCodeLoading(false);
        }
      })
      .catch((err) => {
        console.error("3D code load error:", err);
        if (isMounted) setCodeLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isCode, post.media_url]);

  // Автоматический запуск видео в поле видимости
  useEffect(() => {
    if (!isVideo || !videoRef.current || !containerRef.current) return;

    const currentVideo = videoRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            currentVideo.play().catch(() => {});
          } else {
            currentVideo.pause();
          }
        });
      },
      { threshold: [0.1, 0.5] }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isVideo]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;

    const confirmDelete = window.confirm("Удалить эту 3D работу?");
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePin) {
      onTogglePin(post.id, !!post.is_pinned);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={() => onOpenLightbox(post)}
      className="group relative aspect-square sm:aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-zinc-200/90 hover:border-zinc-400 hover:shadow-lg transition-all duration-300 cursor-pointer select-none"
    >
      {/* 3D Визуал (Исполняемый HTML код через srcDoc, видео или изображение) */}
      {isCode ? (
        <div className="w-full h-full relative bg-white flex items-center justify-center">
          {htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              title={post.content || "3D Visual"}
              className="w-full h-full border-0 pointer-events-none select-none"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : codeLoading ? (
            <div className="flex flex-col items-center justify-center gap-1.5 text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
              <span className="text-[10px] font-mono">Запуск 3D...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-3 text-center text-zinc-400">
              <Code2 className="w-6 h-6 mb-1 text-zinc-300" />
              <span className="text-[10px] font-mono">3D Визуал</span>
            </div>
          )}

          {/* Значок 3D КОД */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-md border border-zinc-200 shadow-xs text-[10px] font-mono font-bold text-zinc-700">
            <Code2 className="w-3 h-3 text-cyan-600" />
            <span>3D КОД</span>
          </div>
        </div>
      ) : isVideo ? (
        <>
          <video
            ref={videoRef}
            src={post.media_url}
            loop
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Значок видео */}
          <div className="absolute top-2.5 left-2.5 z-10 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white">
            <Play className="w-3 h-3 fill-white" />
          </div>
        </>
      ) : imageError ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-50 text-zinc-400">
          <Code2 className="w-6 h-6 mb-1 text-zinc-300" />
          <span className="text-[10px] font-mono">3D Визуал</span>
        </div>
      ) : (
        <img
          src={post.media_url}
          alt="3D render"
          loading="lazy"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      {/* Легкий градиент при наведении */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

      {/* Закрепленный элемент */}
      {post.is_pinned && (
        <div className="absolute top-2.5 right-2.5 z-10 p-1 rounded-md bg-white/90 border border-cyan-400 text-cyan-600 shadow-xs backdrop-blur-md">
          <Pin className="w-3 h-3 rotate-45" />
        </div>
      )}

      {/* Панель администратора (только для urokov.me@gmail.com) */}
      {isAdmin && (
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-zinc-200 shadow-md">
          <button
            onClick={handleTogglePin}
            className={`p-1.5 rounded-lg transition ${
              post.is_pinned
                ? "text-cyan-600 bg-cyan-50"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
            title="Закрепить"
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 transition"
            title="Удалить"
          >
            {isDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
