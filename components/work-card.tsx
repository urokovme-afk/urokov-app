"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pin,
  Trash2,
  Loader2,
  Film,
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

  const isVideo =
    post.media_type === "video" ||
    /\.(mp4|webm|mov|m4v)$/i.test((post.media_url || "").split("?")[0].toLowerCase());

  // Videolarni ko'rinib turganda loop qilish
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

    const confirmDelete = window.confirm("Ushbu 3D ishni o'chirishni tasdiqlaysizmi?");
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
      className="group relative aspect-square sm:aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/80 hover:border-zinc-500/60 transition-all duration-300 cursor-pointer shadow-md select-none"
    >
      {/* 3D Media Visual (Image or Video) */}
      {isVideo ? (
        <video
          ref={videoRef}
          src={post.media_url}
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : imageError ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-900 text-zinc-500">
          <Film className="w-6 h-6 mb-1 text-zinc-600" />
          <span className="text-[10px] font-mono">3D Fayl</span>
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

      {/* Subtle overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

      {/* Video Indicator Icon */}
      {isVideo && (
        <div className="absolute top-2.5 left-2.5 z-10 p-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/90">
          <Play className="w-3 h-3 fill-white" />
        </div>
      )}

      {/* Pinned Badge */}
      {post.is_pinned && (
        <div className="absolute top-2.5 right-2.5 z-10 p-1 rounded-md bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 backdrop-blur-md">
          <Pin className="w-3 h-3 rotate-45" />
        </div>
      )}

      {/* Admin Action Bar (Only for urokov.me@gmail.com) */}
      {isAdmin && (
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-zinc-700/80 shadow-lg">
          <button
            onClick={handleTogglePin}
            className={`p-1.5 rounded-lg transition ${
              post.is_pinned
                ? "text-cyan-400 bg-cyan-950/60"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Pin"
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 transition"
            title="O'chirish"
          >
            {isDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin text-rose-400" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
