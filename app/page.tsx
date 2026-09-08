/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  LogIn,
  Heart,
  MessageSquare,
  User,
  Send,
  Trash2,
  Edit3,
  Check,
  X,
  Shield,
  PlusCircle,
  Loader2,
  Paperclip,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Bell,
  CheckCheck,
  ShieldAlert,
  Pin,
  Film,
  Download,
  Image as ImageIcon,
  Plus,
  Eye,
  Calendar,
  Video,
  SwitchCamera,
  FileText,
  ShieldCheck,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { ThemeToggle } from "../components/theme-toggle";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChatHub } from "../components/chat-hub";

// --- YORDAMCHI FUNKSIYALAR ---
const getTempId = () => Math.floor(Math.random() * 100000000);
const getNowIso = () => new Date().toISOString();
const getRandomStr = () => Math.random().toString(36).substring(2, 9);

function getCleanFileName(url: string, fallback: string = "Файл") {
  try {
    const rawName = url.split("/").pop()?.split("?")[0] || "";
    const decoded = decodeURIComponent(rawName);
    return (
      decoded.replace(/^\d+_[a-z0-9]+[._-]/i, "").replace(/\.[^/.]+$/, "") ||
      fallback
    );
  } catch {
    return fallback;
  }
}

function getYouTubeVideoId(text: string): string | null {
  if (!text) return null;
  const regExp =
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = text.match(regExp);
  return match ? match[1] : null;
}

function getInstagramPostId(text: string): string | null {
  if (!text) return null;
  const regExp =
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i;
  const match = text.match(regExp);
  return match ? match[1] : null;
}

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|avi|ogv)$/i.test(url.split("?")[0].toLowerCase());
}

function isAudioUrl(url: string): boolean {
  if (!url) return false;
  return /\.(mp3|wav|ogg|m4a|aac)$/i.test(url.split("?")[0].toLowerCase());
}

function isDocumentUrl(url: string): boolean {
  if (!url) return false;
  return /\.(pdf|doc|docx|xls|xlsx|txt|zip|rar|csv)$/i.test(
    url.split("?")[0].toLowerCase(),
  );
}

// 🔴 HUJJATLAR UCHUN MAXSUS KARTA
function TelegramDocumentCard({ url }: { url: string }) {
  const fileName = getCleanFileName(url, "Документ");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/40 transition group cursor-pointer select-none"
    >
      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-sm">
        <FileText className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate">
          {fileName}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">Файл</p>
      </div>
      <Download className="w-4 h-4 text-blue-500 shrink-0 opacity-60 group-hover:opacity-100 transition" />
    </a>
  );
}

// 🔴 TELEGRAM VIDEO XABAR
function TelegramVideoMessage({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      if (
        !videoRef.current.muted &&
        videoRef.current.currentTime >= videoRef.current.duration - 0.5
      ) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  };

  return (
    <div className="flex justify-center w-full my-2 select-none z-10">
      <div
        onClick={toggleMute}
        className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden bg-black shadow-lg cursor-pointer group transform transition-transform active:scale-95 flex items-center justify-center shrink-0"
      >
        <video
          ref={videoRef}
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none"
          style={{ transform: "scale(1.02)" }}
        />
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isMuted ? "bg-black/10" : "bg-transparent group-hover:bg-black/10"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center text-white transition-opacity duration-300 ${
              isMuted
                ? "bg-black/50 opacity-100"
                : "bg-black/30 opacity-0 group-hover:opacity-100"
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 🔴 VIDEOLAR UCHUN KARTA
function TelegramVideoCard({
  src,
  onClick,
}: {
  src: string;
  onClick: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem(`loaded_${src}`);
    }
    return false;
  });

  const handleLoad = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoaded(true);
    if (typeof window !== "undefined")
      localStorage.setItem(`loaded_${src}`, "true");
  };

  if (isLoaded) {
    return (
      <video
        src={src}
        controls
        playsInline
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="w-full h-auto max-h-[400px] rounded-xl object-contain bg-black shadow-sm cursor-pointer border border-gray-200 dark:border-gray-800"
      />
    );
  }

  return (
    <div
      onClick={handleLoad}
      className="group relative w-full aspect-video max-h-[300px] rounded-xl overflow-hidden bg-gray-900 cursor-pointer flex items-center justify-center select-none shadow-sm border border-gray-200 dark:border-gray-800"
    >
      <video
        src={`${src}#t=0.1`}
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md scale-110 pointer-events-none"
      />
      <div className="z-10 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-active:scale-95 transition duration-200">
        <Play className="w-5 h-5 ml-1" />
      </div>
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-md rounded-lg text-white text-[10px] font-mono font-medium flex items-center gap-1 pointer-events-none">
        <Film className="w-3 h-3 text-blue-400" />
        <span>Видео</span>
      </div>
    </div>
  );
}

function TelegramAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fileSize, setFileSize] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(src, { method: "HEAD" })
      .then((res) => {
        const bytes = res.headers.get("content-length");
        if (bytes && isMounted) {
          setFileSize(`${(parseInt(bytes, 10) / (1024 * 1024)).toFixed(1)} MB`);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (!isLoaded) {
      setIsLoading(true);
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => {
          setIsLoaded(true);
          setIsLoading(false);
          setIsPlaying(true);
        })
        .catch(() => setIsLoading(false));
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const displayName = getCleanFileName(src, "Аудиозапись");
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="p-3 bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-3 select-none">
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <button
        type="button"
        onClick={togglePlay}
        disabled={isLoading}
        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm transition active:scale-95 disabled:opacity-70 cursor-pointer"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 fill-white" />
        ) : (
          <Play className="w-4 h-4 fill-white ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-gray-900 dark:text-gray-200 truncate flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{displayName}</span>
          </span>
          <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400 shrink-0 ml-2">
            {isLoaded
              ? `${formatTime(currentTime)} / ${formatTime(duration)}`
              : fileSize || "Audio"}
          </span>
        </div>
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!isLoaded}
            className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none disabled:opacity-40"
            style={{
              background: `linear-gradient(to right, #2563eb ${progressPercent}%, rgba(128,128,128,0.2) ${progressPercent}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// 🔴 RASMLAR UCHUN KARTA
function TelegramImageCard({
  src,
  onClick,
}: {
  src: string;
  onClick: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem(`loaded_${src}`);
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLoad = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoaded) {
      onClick();
      return;
    }
    setIsLoading(true);
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setIsLoading(false);
      setIsLoaded(true);
      if (typeof window !== "undefined")
        localStorage.setItem(`loaded_${src}`, "true");
    };
    img.onerror = () => {
      setIsLoading(false);
      setIsLoaded(true);
    };
  };

  if (isLoaded) {
    return (
      <div className="w-full max-h-[380px] rounded-xl overflow-hidden bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center border border-gray-200 dark:border-gray-800/80 shadow-sm">
        <img
          src={src}
          alt="Post media"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full h-auto max-h-[380px] object-cover cursor-pointer hover:opacity-95 transition"
        />
      </div>
    );
  }

  return (
    <div
      onClick={handleLoad}
      className="group relative w-full aspect-video max-h-[320px] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 cursor-pointer flex items-center justify-center select-none shadow-sm"
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 blur-xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${src})` }}
      />
      <div className="z-10 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-active:scale-95 transition duration-200 shadow-lg">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
      </div>
      <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-xl text-white text-[11px] font-mono font-medium flex items-center gap-1.5 pointer-events-none border border-white/10 z-10">
        <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
        <span>Загрузить фото</span>
      </div>
    </div>
  );
}

function InstagramCarousel({
  urls,
  onImageClick,
}: {
  urls: string[];
  onImageClick: (url: string, type: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const prevSlide = (
    e?: React.MouseEvent | React.TouchEvent | React.PointerEvent,
  ) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? urls.length - 1 : prev - 1));
  };
  const nextSlide = (
    e?: React.MouseEvent | React.TouchEvent | React.PointerEvent,
  ) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === urls.length - 1 ? 0 : prev + 1));
  };

  // Touch Screen and Pointer (Mouse swipe) logic
  const handlePointerDown = (e: React.PointerEvent) => {
    touchStartX.current = e.clientX;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.clientX;

    if (diff > 40) {
      nextSlide();
    } else if (diff < -40) {
      prevSlide();
    }
    touchStartX.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 40) {
      nextSlide();
    } else if (diff < -40) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  const currentUrl = urls[currentIndex];
  const isVideoOrAudio = isVideoUrl(currentUrl);

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5 select-none group touch-pan-y"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-center max-h-[400px] w-full bg-black/40">
        {isVideoOrAudio ? (
          <TelegramVideoCard
            src={currentUrl}
            onClick={() => onImageClick(currentUrl, "video")}
          />
        ) : (
          <TelegramImageCard
            src={currentUrl}
            onClick={() => onImageClick(currentUrl, "image")}
          />
        )}
      </div>
      {urls.length > 1 && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-white text-[10px] font-mono font-bold pointer-events-none z-10">
          {currentIndex + 1} / {urls.length}
        </div>
      )}
      {urls.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-md z-10 active:scale-95 shadow-md cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-md z-10 active:scale-95 shadow-md cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

interface NotificationItem {
  id: number;
  user_email: string;
  actor_email?: string;
  actor_name?: string;
  actor_avatar?: string;
  type: string;
  title: string;
  message: string;
  post_id?: number;
  is_read: boolean;
  created_at: string;
}
interface ProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
}
interface Comment {
  id: string;
  post_id: number;
  user_email: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  parent_id?: string | null;
  created_at: string;
}
interface Reaction {
  id?: number;
  post_id: number;
  user_email: string;
  emoji?: string;
  created_at?: string;
}
interface Post {
  id: number;
  content: string;
  media_url?: string;
  media_type?: string;
  is_pinned?: boolean;
  created_at: string;
}
interface Story {
  id: number;
  user_email: string;
  media_url: string;
  media_type: string;
  caption?: string;
  duration_days: number;
  expires_at: string;
  created_at: string;
}
interface StoryView {
  id?: number;
  story_id: number;
  viewer_email: string;
  viewed_at: string;
}
interface StoryLike {
  id?: number;
  story_id: number;
  user_email: string;
  created_at: string;
}

export default function Home() {
  const router = useRouter();
  const [loadingSplash, setLoadingSplash] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);

  // --- GLOBALS ---
  const ADMIN_EMAIL = "urokov.me@gmail.com";
  const myEmail = session?.user?.email?.toLowerCase().trim() || "";
  const isAdmin = myEmail === ADMIN_EMAIL.toLowerCase().trim();

  const [isBanned, setIsBanned] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const lastPlayedNotifIdRef = useRef<number | null>(null);
  const lastPlayTime = useRef<number>(0);

  // POST REFLARI
  const postRefs = useRef<Record<number, HTMLElement | null>>({});

  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(
    null,
  );
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToComment, setReplyingToComment] = useState<Comment | null>(
    null,
  );
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const [showQuickPost, setShowQuickPost] = useState(false);
  const [quickPostContent, setQuickPostContent] = useState("");
  const [quickMediaUrls, setQuickMediaUrls] = useState<string[]>([]);
  const [quickMediaType, setQuickMediaType] = useState<string>("none");
  const [quickIsPinned, setQuickIsPinned] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: string;
  } | null>(null);

  const [stories, setStories] = useState<Story[]>([]);
  const [storyViews, setStoryViews] = useState<StoryView[]>([]);
  const [storyLikes, setStoryLikes] = useState<StoryLike[]>([]);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string | null>(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [storyDays, setStoryDays] = useState(1);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const storyFileInputRef = useRef<HTMLInputElement | null>(null);

  const [viewingUserEmail, setViewingUserEmail] = useState<string | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);
  const viewedSessionTracker = useRef<Set<string>>(new Set());

  const [showLikesModalForPostId, setShowLikesModalForPostId] = useState<
    number | null
  >(null);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDuration, setVideoDuration] = useState(5);

  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const recordActivity = async (
    userEmail: string,
    action: string,
    details: string,
  ) => {
    if (!userEmail) return;
    try {
      await supabase.from("activity_logs").insert([
        {
          user_email: userEmail.toLowerCase().trim(),
          action,
          details,
        },
      ]);
    } catch (err) {
      console.error("Log saqlashda xatolik:", err);
    }
  };

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const playNotificationSound = (notifId: number) => {
    if (lastPlayedNotifIdRef.current === notifId) return;
    lastPlayedNotifIdRef.current = notifId;
    const now = Date.now();
    if (now - lastPlayTime.current < 1000) return;
    lastPlayTime.current = now;
    try {
      const audio = new Audio("/notification.mp3");
      const playPromise = audio.play();
      if (playPromise !== undefined) playPromise.catch(() => {});
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    if (showNotifications)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    let isMounted = true;

    const checkSessionAndRole = async (curSession: Session | null) => {
      if (!isMounted) return;
      setSession(curSession);
      sessionRef.current = curSession;

      if (curSession?.user?.email) {
        const email = curSession.user.email.toLowerCase().trim();
        const { data: prof } = await supabase
          .from("profiles")
          .select("status")
          .eq("email", email)
          .single();
        setIsBanned(prof?.status === "banned");

        const { data: notifs } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_email", email)
          .order("created_at", { ascending: false });
        if (notifs) setNotifications(notifs);
      } else {
        setIsBanned(false);
        setNotifications([]);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data: { session: curSession } }) =>
        checkSessionAndRole(curSession),
      );
    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((_e, curSession) =>
      checkSessionAndRole(curSession),
    );

    const loadData = async () => {
      const { data: profs } = await supabase
        .from("profiles")
        .select("email, full_name, username, avatar_url");
      if (profs) {
        const map: Record<string, ProfileData> = {};
        profs.forEach((p) => {
          if (p.email) map[p.email.toLowerCase().trim()] = p;
        });
        if (isMounted) setProfiles(map);
      }

      const { data: pts } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (isMounted && pts) setPosts(pts);

      const { data: rcts } = await supabase.from("reactions").select("*");
      if (isMounted && rcts) {
        setReactions(
          rcts.map((r: Record<string, unknown>) => ({
            id: Number(r.id),
            post_id: Number(r.post_id),
            user_email: String(r.user_email || r.email || "")
              .toLowerCase()
              .trim(),
            emoji: String(r.emoji || "❤️"),
            created_at: String(r.created_at || "2024-01-01T00:00:00.000Z"),
          })),
        );
      }

      const { data: cmts } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: true });
      if (isMounted && cmts) setComments(cmts);

      const { data: sts } = await supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false });
      if (isMounted && sts) setStories(sts);

      const { data: stViews } = await supabase.from("story_views").select("*");
      if (isMounted && stViews) {
        setStoryViews(
          stViews.map((v: Record<string, unknown>) => ({
            id: Number(v.id),
            story_id: Number(v.story_id),
            viewer_email: String(v.viewer_email).toLowerCase().trim(),
            viewed_at: String(v.viewed_at || "2024-01-01T00:00:00.000Z"),
          })),
        );
      }

      const { data: stLikes } = await supabase.from("story_likes").select("*");
      if (isMounted && stLikes) {
        setStoryLikes(
          stLikes.map((l: Record<string, unknown>) => ({
            id: Number(l.id),
            story_id: Number(l.story_id),
            user_email: String(l.user_email).toLowerCase().trim(),
            created_at: String(l.created_at || "2024-01-01T00:00:00.000Z"),
          })),
        );
      }
    };

    loadData();

    const channelName = `realtime-feed-${getRandomStr()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        async (payload) => {
          if (!isMounted) return;
          const { table, eventType: event } = payload;

          if (table === "posts") {
            if (event === "INSERT")
              setPosts((prev) => [
                payload.new as Post,
                ...prev.filter((p) => p.id !== (payload.new as Post).id),
              ]);
            else if (event === "UPDATE")
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === (payload.new as Post).id ? (payload.new as Post) : p,
                ),
              );
            else if (event === "DELETE")
              setPosts((prev) =>
                prev.filter((p) => p.id !== (payload.old as { id: number }).id),
              );
          } else if (table === "comments") {
            if (event === "INSERT") {
              const newC = payload.new as Comment;
              setComments((prev) => {
                if (prev.some((c) => String(c.id) === String(newC.id)))
                  return prev;

                const tempMatch = prev.find(
                  (c) =>
                    String(c.id).startsWith("temp_") &&
                    c.user_email === newC.user_email &&
                    c.content === newC.content &&
                    String(c.post_id) === String(newC.post_id),
                );

                if (tempMatch) {
                  return prev.map((c) => (c.id === tempMatch.id ? newC : c));
                }

                return [...prev, newC];
              });
            } else if (event === "UPDATE") {
              setComments((prev) =>
                prev.map((c) =>
                  String(c.id) === String((payload.new as Comment).id)
                    ? (payload.new as Comment)
                    : c,
                ),
              );
            } else if (event === "DELETE") {
              setComments((prev) =>
                prev.filter(
                  (c) =>
                    String(c.id) !== String((payload.old as { id: string }).id),
                ),
              );
            }
          } else if (table === "reactions") {
            if (event === "INSERT") {
              const newR = payload.new as Record<string, unknown>;
              const parsedR: Reaction = {
                id: Number(newR.id),
                post_id: Number(newR.post_id),
                user_email: String(newR.user_email || newR.email || "")
                  .toLowerCase()
                  .trim(),
                emoji: String(newR.emoji || "❤️"),
                created_at: String(newR.created_at || getNowIso()),
              };
              setReactions((prev) => {
                const filtered = prev.filter(
                  (r) =>
                    !(
                      String(r.post_id) === String(parsedR.post_id) &&
                      r.user_email === parsedR.user_email
                    ),
                );
                return [...filtered, parsedR];
              });
            } else if (event === "DELETE") {
              setReactions((prev) =>
                prev.filter(
                  (r) =>
                    String(r.id) !== String((payload.old as { id: number }).id),
                ),
              );
            }
          } else if (table === "story_likes") {
            if (event === "INSERT") {
              const newL = payload.new as Record<string, unknown>;
              const parsedL: StoryLike = {
                id: Number(newL.id) || getTempId(),
                story_id: Number(newL.story_id),
                user_email: String(newL.user_email).toLowerCase().trim(),
                created_at: String(newL.created_at || getNowIso()),
              };
              setStoryLikes((prev) => {
                const filtered = prev.filter(
                  (l) =>
                    !(
                      String(l.story_id) === String(parsedL.story_id) &&
                      l.user_email === parsedL.user_email
                    ),
                );
                return [...filtered, parsedL];
              });
            } else if (event === "DELETE") {
              setStoryLikes((prev) =>
                prev.filter(
                  (l) =>
                    String(l.id) !== String((payload.old as { id: number }).id),
                ),
              );
            }
          } else if (table === "story_views") {
            if (event === "INSERT") {
              const newV = payload.new as Record<string, unknown>;
              const parsedV: StoryView = {
                id: Number(newV.id) || getTempId(),
                story_id: Number(newV.story_id),
                viewer_email: String(newV.viewer_email).toLowerCase().trim(),
                viewed_at: String(newV.viewed_at || getNowIso()),
              };
              setStoryViews((prev) => {
                const exists = prev.some(
                  (v) =>
                    String(v.story_id) === String(parsedV.story_id) &&
                    v.viewer_email === parsedV.viewer_email,
                );
                if (exists) return prev;
                return [...prev, parsedV];
              });
            } else if (event === "DELETE") {
              setStoryViews((prev) =>
                prev.filter(
                  (v) =>
                    String(v.id) !== String((payload.old as { id: number }).id),
                ),
              );
            }
          } else if (table === "notifications") {
            if (event === "INSERT") {
              const newNotif = payload.new as NotificationItem;
              const curEmail = sessionRef.current?.user?.email
                ?.toLowerCase()
                .trim();
              if (
                curEmail &&
                newNotif.user_email?.toLowerCase().trim() === curEmail
              ) {
                playNotificationSound(newNotif.id);
                setNotifications((prev) => [
                  newNotif,
                  ...prev.filter((n) => n.id !== newNotif.id),
                ]);
              }
            } else if (event === "UPDATE") {
              const upNotif = payload.new as NotificationItem;
              setNotifications((prev) =>
                prev.map((n) => (n.id === upNotif.id ? upNotif : n)),
              );
            } else if (event === "DELETE") {
              setNotifications((prev) =>
                prev.filter(
                  (n) =>
                    String(n.id) !== String((payload.old as { id: number }).id),
                ),
              );
            }
          } else if (table === "stories") {
            if (event === "INSERT") {
              const newStory = payload.new as Story;
              setStories((prev) => [
                newStory,
                ...prev.filter((s) => String(s.id) !== String(newStory.id)),
              ]);
            } else if (event === "DELETE") {
              setStories((prev) =>
                prev.filter(
                  (s) =>
                    String(s.id) !== String((payload.old as { id: number }).id),
                ),
              );
            }
          }
        },
      )
      .subscribe();

    const timer = setTimeout(() => {
      if (isMounted) setLoadingSplash(false);
    }, 3000);
    return () => {
      isMounted = false;
      authSub.unsubscribe();
      supabase.removeChannel(channel);
      clearTimeout(timer);
    };
  }, []);

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
      );
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notif.id);
    }
    setShowNotifications(false);

    if (notif.type === "story_like" && notif.post_id) {
      const targetStory = stories.find(
        (s) => Number(s.id) === Number(notif.post_id),
      );
      if (targetStory) {
        handleOpenStory(targetStory.user_email, 0);
        return;
      }
    }

    if (notif.post_id) {
      setActiveCommentPostId(notif.post_id);
      setTimeout(() => {
        const postElement = postRefs.current[notif.post_id as number];
        if (postElement) {
          postElement.scrollIntoView({ behavior: "smooth", block: "center" });
          postElement.classList.add("ring-2", "ring-blue-500");
          setTimeout(() => {
            postElement.classList.remove("ring-2", "ring-blue-500");
          }, 2000);
        }
      }, 100);
    }
  };

  const startCamera = async (mode: "user" | "environment") => {
    try {
      if (liveVideoRef.current && liveVideoRef.current.srcObject) {
        const tracks = (
          liveVideoRef.current.srcObject as MediaStream
        ).getTracks();
        tracks.forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1080 },
          height: { ideal: 1080 },
          aspectRatio: 1,
        },
        audio: true,
      });
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert(
        "Не удалось получить доступ к камере или микрофону. Проверьте разрешения бразуера.",
      );
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const startRecording = () => {
    if (!liveVideoRef.current || !liveVideoRef.current.srcObject) return;
    recordedChunksRef.current = [];
    const stream = liveVideoRef.current.srcObject as MediaStream;

    let options = { mimeType: "video/webm; codecs=vp9" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "video/mp4" };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "" };
        }
      }
    }

    const mediaRecorder = new MediaRecorder(
      stream,
      options.mimeType ? options : undefined,
    );

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const file = new File([blob], `videomessage_${Date.now()}.webm`, {
        type: "video/webm",
      });
      await uploadVideoMessage(file);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(200);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const closeVideoRecorder = () => {
    if (isRecording) stopRecording();
    if (liveVideoRef.current && liveVideoRef.current.srcObject) {
      const tracks = (
        liveVideoRef.current.srcObject as MediaStream
      ).getTracks();
      tracks.forEach((t) => t.stop());
    }
    setShowVideoRecorder(false);
  };

  const uploadVideoMessage = async (file: File) => {
    setUploadingFile(true);
    setUploadProgressText("Отправка видеосообщения...");
    try {
      const fileExt = "webm";
      const fileName = `${Date.now()}_video_message_${getRandomStr()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(filePath, file);
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("media").getPublicUrl(filePath);

      setQuickMediaUrls((prev) => [...prev, data.publicUrl]);
      setQuickMediaType("video_message");
      closeVideoRecorder();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Ошибка при сохранении видеосообщения.");
    } finally {
      setUploadingFile(false);
      setUploadProgressText("");
    }
  };

  const handleMultipleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFile(true);
    const urls: string[] = [];
    let detectedType = "image";
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Загрузка ${i + 1}/${files.length}...`);
        const fileExt = file.name.split(".").pop()?.toLowerCase();
        const originalCleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_");
        const fileName = `${Date.now()}_${originalCleanName}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: upErr } = await supabase.storage
          .from("media")
          .upload(filePath, file);
        if (upErr) continue;

        const { data } = supabase.storage.from("media").getPublicUrl(filePath);
        urls.push(data.publicUrl);

        if (
          file.type.startsWith("video/") ||
          ["mp4", "webm", "mov"].includes(fileExt || "")
        ) {
          detectedType = "video";
        } else if (
          file.type.startsWith("audio/") ||
          ["mp3", "wav", "ogg", "m4a"].includes(fileExt || "")
        ) {
          detectedType = "audio";
        } else if (
          file.type.startsWith("application/") ||
          file.type.startsWith("text/") ||
          [
            "pdf",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "txt",
            "zip",
            "rar",
            "csv",
          ].includes(fileExt || "")
        ) {
          detectedType = "document";
        }
      }
      setQuickMediaUrls((prev) => [...prev, ...urls]);
      setQuickMediaType(detectedType);
    } finally {
      setUploadingFile(false);
      setUploadProgressText("");
    }
  };

  const handleSaveQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentMediaUrls = [...quickMediaUrls];
    if (linkInputRef.current && linkInputRef.current.value.trim())
      currentMediaUrls.push(linkInputRef.current.value.trim());
    if (
      (!quickPostContent.trim() && currentMediaUrls.length === 0) ||
      isSubmittingPost
    )
      return;

    setIsSubmittingPost(true);
    const mediaString = currentMediaUrls.join(",");
    let determinedMediaType = "none";

    if (currentMediaUrls.length > 0) {
      if (quickMediaType !== "none") {
        determinedMediaType = quickMediaType;
      } else if (mediaString.match(/\.(mp4|webm|mov)$/i)) {
        determinedMediaType = "video";
      } else if (mediaString.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
        determinedMediaType = "audio";
      } else if (
        mediaString.match(/\.(pdf|doc|docx|xls|xlsx|txt|zip|rar|csv)$/i)
      ) {
        determinedMediaType = "document";
      } else {
        determinedMediaType = "image";
      }
    }

    try {
      if (editingPostId) {
        await supabase
          .from("posts")
          .update({
            content: quickPostContent.trim(),
            media_url: mediaString || null,
            media_type: determinedMediaType,
            is_pinned: quickIsPinned,
          })
          .eq("id", editingPostId);
      } else {
        await supabase.from("posts").insert([
          {
            content: quickPostContent.trim(),
            media_url: mediaString || null,
            media_type: determinedMediaType,
            is_pinned: quickIsPinned,
          },
        ]);
      }
      resetPostForm();
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const resetPostForm = () => {
    setEditingPostId(null);
    setQuickPostContent("");
    setQuickMediaUrls([]);
    setQuickMediaType("none");
    setQuickIsPinned(false);
    setShowQuickPost(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (linkInputRef.current) linkInputRef.current.value = "";
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm("Вы действительно хотите удалить эту публикацию?")) return;
    const postToDelete = posts.find((p) => p.id === id);

    if (postToDelete?.media_url) {
      const urls = postToDelete.media_url
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const filesToRemove: string[] = [];
      urls.forEach((url) => {
        const match = url.match(
          /\/storage\/v1\/object\/public\/media\/(.+?)(?:\?|$)/,
        );
        if (match && match[1]) {
          filesToRemove.push(match[1]);
        }
      });
      if (filesToRemove.length > 0) {
        try {
          await supabase.storage.from("media").remove(filesToRemove);
        } catch (e) {
          console.error("Storage delete error:", e);
        }
      }
    }

    setPosts((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("posts").delete().eq("id", id);

    if (session?.user?.email) {
      await recordActivity(
        session.user.email,
        "Удаление публикации",
        `Администратор удалил пост #${id} из ленты`,
      );
    }
  };

  const handleSelectStoryFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!isAdmin || !session?.user?.email) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMb = 100;
    if (file.size > maxMb * 1024 * 1024) {
      alert(`Размер файла не должен превышать ${maxMb} МБ!`);
      return;
    }

    setStoryFile(file);
    setStoryPreview(URL.createObjectURL(file));
    setShowCreateStory(true);
  };

  const handleUploadStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !storyFile || !session?.user?.email || isUploadingStory)
      return;

    setIsUploadingStory(true);
    const emailLocal = session.user.email.toLowerCase().trim();

    try {
      const fileExt = storyFile.name.split(".").pop()?.toLowerCase();
      const fileName = `${Date.now()}_story_${getRandomStr()}.${fileExt}`;
      const filePath = `user_stories/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from("stories")
        .upload(filePath, storyFile);
      if (upErr) throw new Error("Storage xatosi: " + upErr.message);

      const { data: urlData } = supabase.storage
        .from("stories")
        .getPublicUrl(filePath);
      const isVideo = storyFile.type.startsWith("video/");

      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + storyDays);

      const { data: stData, error: dbErr } = await supabase
        .from("stories")
        .insert([
          {
            user_email: emailLocal,
            media_url: urlData.publicUrl,
            media_type: isVideo ? "video" : "image",
            caption: storyCaption.trim() || null,
            duration_days: storyDays,
            expires_at: expiresDate.toISOString(),
          },
        ])
        .select();

      if (dbErr) throw new Error("Baza xatosi: " + dbErr.message);

      if (stData && stData.length > 0) {
        const newStory = stData[0] as Story;
        setStories((prev) => [
          newStory,
          ...prev.filter((s) => String(s.id) !== String(newStory.id)),
        ]);
      }

      setShowCreateStory(false);
      setStoryFile(null);
      setStoryPreview(null);
      setStoryCaption("");
      setStoryDays(1);
    } catch (err: unknown) {
      console.error("Full upload error:", err);
      alert((err as Error).message || "Ошибка при загрузке истории!");
    } finally {
      setIsUploadingStory(false);
    }
  };

  const handleDeleteStory = async (storyId: number) => {
    if (!confirm("Вы действительно хотите удалить эту историю?")) return;
    const storyToDelete = stories.find((s) => String(s.id) === String(storyId));
    if (storyToDelete?.media_url) {
      try {
        const urlParts = storyToDelete.media_url.split(
          "/storage/v1/object/public/stories/",
        );
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split("?")[0];
          if (filePath) supabase.storage.from("stories").remove([filePath]);
        }
      } catch {
        /* ignore */
      }
    }
    setStories((prev) => prev.filter((s) => String(s.id) !== String(storyId)));
    await supabase.from("stories").delete().eq("id", storyId);
  };

  const activeStories = viewingUserEmail
    ? stories
        .filter((s) => {
          const isTarget =
            s.user_email.toLowerCase().trim() ===
            viewingUserEmail.toLowerCase().trim();
          if (!isTarget) return false;

          return s.expires_at > new Date().toISOString();
        })
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
    : [];

  const currentStory = activeStories[activeStoryIndex];

  const handleStoryLike = async (storyId: number, targetEmail: string) => {
    if (!session?.user?.email) {
      router.push("/login");
      return;
    }
    if (isBanned) return;

    const emailLocal = session.user.email.toLowerCase().trim();
    const userProf = profiles[emailLocal];
    const identifier =
      userProf?.username || userProf?.full_name || emailLocal.split("@")[0];
    const uName = identifier.startsWith("@") ? identifier : `@${identifier}`;

    const existing = storyLikes.find(
      (l) =>
        String(l.story_id) === String(storyId) &&
        l.user_email.toLowerCase().trim() === emailLocal,
    );

    if (existing) {
      setStoryLikes((prev) => prev.filter((l) => l.id !== existing.id));
      await supabase.from("story_likes").delete().eq("id", existing.id);
    } else {
      const tempId = getTempId();
      setStoryLikes((prev) => [
        ...prev.filter(
          (l) =>
            !(
              String(l.story_id) === String(storyId) &&
              l.user_email === emailLocal
            ),
        ),
        {
          id: tempId,
          story_id: storyId,
          user_email: emailLocal,
          created_at: getNowIso(),
        },
      ]);
      const { data } = await supabase
        .from("story_likes")
        .insert([{ story_id: storyId, user_email: emailLocal }])
        .select();
      if (data && data.length > 0)
        setStoryLikes((prev) =>
          prev.map((l) => (l.id === tempId ? (data[0] as StoryLike) : l)),
        );

      if (targetEmail.toLowerCase().trim() !== emailLocal) {
        await supabase.from("notifications").insert([
          {
            user_email: targetEmail.toLowerCase().trim(),
            actor_name: uName,
            actor_avatar: userProf?.avatar_url || "",
            type: "story_like",
            title: "Реакция на историю",
            message: "поставил(а) ❤️ вашей истории",
            post_id: storyId,
            is_read: false,
          },
        ]);
      }
    }
  };

  const handleOpenStory = (email: string, index = 0) => {
    setIsMediaLoaded(false);
    setStoryProgress(0);
    setActiveStoryIndex(index);
    setViewingUserEmail(email);
  };

  useEffect(() => {
    if (!currentStory || !session?.user?.email) return;
    const emailLocal = session.user.email.toLowerCase().trim();
    if (currentStory.user_email.toLowerCase().trim() === emailLocal) return;

    const viewKey = `${currentStory.id}_${emailLocal}`;
    if (viewedSessionTracker.current.has(viewKey)) return;
    viewedSessionTracker.current.add(viewKey);

    const recordView = async () => {
      const alreadyViewedLocally = storyViews.some(
        (v) =>
          String(v.story_id) === String(currentStory.id) &&
          v.viewer_email.toLowerCase().trim() === emailLocal,
      );
      if (!alreadyViewedLocally) {
        setStoryViews((prev) => [
          ...prev.filter(
            (v) =>
              !(
                String(v.story_id) === String(currentStory.id) &&
                v.viewer_email === emailLocal
              ),
          ),
          {
            id: getTempId(),
            story_id: currentStory.id,
            viewer_email: emailLocal,
            viewed_at: getNowIso(),
          },
        ]);
        await supabase
          .from("story_views")
          .insert([{ story_id: currentStory.id, viewer_email: emailLocal }]);
      }
    };
    recordView();
  }, [currentStory?.id, session?.user?.email, storyViews]);

  useEffect(() => {
    if (videoRef.current) {
      if (isStoryPaused || !isMediaLoaded) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  }, [isStoryPaused, isMediaLoaded]);

  useEffect(() => {
    if (
      !viewingUserEmail ||
      isStoryPaused ||
      showViewersList ||
      !currentStory ||
      !isMediaLoaded
    )
      return;
    const isVideo = currentStory.media_type === "video";
    const totalDurationMs = isVideo ? videoDuration * 1000 : 5000;
    const interval = 50;
    const step = 100 / (totalDurationMs / interval);

    const timer = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIndex < activeStories.length - 1) {
            setIsMediaLoaded(false);
            setActiveStoryIndex((i) => i + 1);
            setStoryProgress(0);
            return 0;
          } else {
            setViewingUserEmail(null);
            setStoryProgress(0);
            return 0;
          }
        }
        return prev + step;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [
    viewingUserEmail,
    activeStoryIndex,
    activeStories.length,
    isStoryPaused,
    showViewersList,
    currentStory,
    videoDuration,
    isMediaLoaded,
  ]);

  const getUniqueStoryViews = (storyId: number) => {
    const rawViews = storyViews.filter(
      (v) => String(v.story_id) === String(storyId),
    );
    const unique: StoryView[] = [];
    const seen = new Set();
    for (const view of rawViews) {
      if (!seen.has(view.viewer_email)) {
        seen.add(view.viewer_email);
        unique.push(view);
      }
    }
    return unique.sort(
      (a, b) =>
        new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime(),
    );
  };

  const handleTogglePin = async (post: Post) => {
    const newPinned = !post.is_pinned;
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, is_pinned: newPinned } : p)),
    );
    await supabase
      .from("posts")
      .update({ is_pinned: newPinned })
      .eq("id", post.id);
  };

  const startEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setQuickPostContent(post.content);
    setQuickMediaUrls(
      post.media_url
        ? post.media_url
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    );
    setQuickMediaType(post.media_type || "none");
    setQuickIsPinned(Boolean(post.is_pinned));
    setShowQuickPost(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderContentWithEmbeds = (text: string) => {
    if (!text) return null;
    const ytId = getYouTubeVideoId(text);
    const igId = getInstagramPostId(text);

    const renderFormattedText = (content: string) => {
      const regex = /(https?:\/\/[^\s]+|#[a-zA-Zа-яА-Я0-9_ёЁ]+)/g;
      const parts = content.split(regex);

      return parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith("http")) {
          if (getYouTubeVideoId(part) || getInstagramPostId(part)) return null;
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline break-all cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }

        if (part.startsWith("#")) {
          return (
            <span key={index} className="text-blue-500 font-medium">
              {part}
            </span>
          );
        }

        return part;
      });
    };

    return (
      <div className="space-y-2 select-none text-left w-full mt-2">
        <div className="text-[15px] leading-snug whitespace-pre-wrap text-gray-900 dark:text-gray-100 break-words">
          {renderFormattedText(text)}
        </div>

        {ytId && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm bg-black mt-2">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}`}
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        )}

        {igId && (
          <div className="relative w-full max-w-[320px] mx-auto rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#111] mt-2">
            <iframe
              src={`https://www.instagram.com/p/${igId}/embed/`}
              className="w-full h-[400px] border-0 overflow-hidden"
              scrolling="no"
              // @ts-expect-error - React allowtransparency typexatosi chiqmasligi uchun
              allowtransparency="true"
              allow="encrypted-media"
            />
          </div>
        )}
      </div>
    );
  };

  const handleReaction = async (postId: number) => {
    if (!session?.user?.email) {
      router.push("/login");
      return;
    }
    if (isBanned) return;

    const emailLocal = session.user.email.toLowerCase().trim();
    const userProf = profiles[emailLocal];
    const identifier =
      userProf?.username || userProf?.full_name || emailLocal.split("@")[0];
    const uName = identifier.startsWith("@") ? identifier : `@${identifier}`;

    const existing = reactions.find(
      (r) =>
        String(r.post_id) === String(postId) && r.user_email === emailLocal,
    );

    if (existing) {
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      const tempId = getTempId();
      setReactions((prev) => [
        ...prev.filter((r) => r.id !== tempId),
        {
          id: tempId,
          post_id: postId,
          user_email: emailLocal,
          emoji: "❤️",
          created_at: getNowIso(),
        },
      ]);
      const { data } = await supabase
        .from("reactions")
        .insert([{ post_id: postId, user_email: emailLocal, emoji: "❤️" }])
        .select();

      if (data && data.length > 0) {
        setReactions((prev) =>
          prev.map((r) => (r.id === tempId ? (data[0] as Reaction) : r)),
        );
      }

      if (ADMIN_EMAIL.toLowerCase().trim() !== emailLocal) {
        await supabase.from("notifications").insert([
          {
            user_email: ADMIN_EMAIL.toLowerCase().trim(),
            actor_name: uName,
            actor_avatar: userProf?.avatar_url || "",
            type: "like",
            title: "Новая реакция",
            message: "поставил(а) ❤️ вашему посту",
            post_id: postId,
            is_read: false,
          },
        ]);
      }
    }
  };

  const handleAddComment = async (postId: number) => {
    if (!session?.user?.email) {
      router.push("/login");
      return;
    }
    if (isBanned || !newCommentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    const emailLocal = session.user.email.toLowerCase().trim();
    const userProf = profiles[emailLocal];
    const uName = userProf?.username
      ? `@${userProf.username}`
      : userProf?.full_name || emailLocal.split("@")[0];
    const tempId = `temp_${getRandomStr()}`;

    const textToSend = newCommentText.trim();
    const currentReplyingTo = replyingToComment;

    setNewCommentText("");
    setReplyingToComment(null);

    setComments((prev) => [
      ...prev,
      {
        id: tempId,
        post_id: postId,
        user_email: emailLocal,
        user_name: uName,
        user_avatar: userProf?.avatar_url || "",
        content: textToSend,
        parent_id: currentReplyingTo ? currentReplyingTo.id : null,
        created_at: getNowIso(),
      },
    ]);

    try {
      const { data } = await supabase
        .from("comments")
        .insert([
          {
            post_id: postId,
            user_email: emailLocal,
            user_name: uName,
            user_avatar: userProf?.avatar_url || "",
            content: textToSend,
            parent_id: currentReplyingTo ? currentReplyingTo.id : null,
          },
        ])
        .select();

      if (data && data.length > 0) {
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? (data[0] as Comment) : c)),
        );

        await recordActivity(
          emailLocal,
          "Новый комментарий",
          `Пользователь оставил комментарий под постом #${postId}: "${textToSend.substring(0, 30)}${textToSend.length > 30 ? "..." : ""}"`,
        );

        const recipientEmail = currentReplyingTo
          ? currentReplyingTo.user_email.toLowerCase().trim()
          : ADMIN_EMAIL.toLowerCase().trim();

        if (recipientEmail !== emailLocal) {
          await supabase.from("notifications").insert([
            {
              user_email: recipientEmail,
              actor_name: uName,
              actor_avatar: userProf?.avatar_url || "",
              type: "comment",
              title: currentReplyingTo
                ? "Ответ на комментарий"
                : "Новый комментарий",
              message: currentReplyingTo
                ? `ответил(а) на ваш комментарий: "${textToSend.substring(0, 25)}${textToSend.length > 25 ? "..." : ""}"`
                : `прокомментировал(а): "${textToSend.substring(0, 25)}${textToSend.length > 25 ? "..." : ""}"`,
              post_id: postId,
              is_read: false,
            },
          ]);
        }
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setComments((prev) =>
      prev.filter((c) => String(c.id) !== String(commentId)),
    );
    await supabase.from("comments").delete().eq("id", commentId);

    if (session?.user?.email) {
      await recordActivity(
        session.user.email,
        "Удаление комментария",
        `Пользователь удалил комментарий`,
      );
    }
  };

  const handleSaveEditedComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    setComments((prev) =>
      prev.map((c) =>
        String(c.id) === String(commentId)
          ? { ...c, content: editingCommentText.trim() }
          : c,
      ),
    );
    await supabase
      .from("comments")
      .update({ content: editingCommentText.trim() })
      .eq("id", commentId);
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  if (loadingSplash) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none"
        >
          <source src="/intro.mp4" type="video/mp4" />
        </video>
      </div>
    );
  }

  const userAvatar =
    profiles[myEmail]?.avatar_url || session?.user?.user_metadata?.avatar_url;
  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const renderSingleComment = (comment: Comment, depth = 0) => {
    const isOwner = myEmail === comment.user_email.toLowerCase().trim();
    const canManage = isOwner || isAdmin;
    const isEditing = editingCommentId === comment.id;
    const commentProfile = profiles[comment.user_email.toLowerCase().trim()];
    const currentName = commentProfile?.username
      ? `@${commentProfile.username}`
      : commentProfile?.full_name || comment.user_name || "Пользователь";
    const userProfileUrl = `/profile/${encodeURIComponent(comment.user_email)}`;

    return (
      <div
        key={comment.id}
        className="flex gap-2.5 items-start group mt-3 w-full"
        style={{ marginLeft: `${Math.min(depth, 4) * 20}px` }}
      >
        <Link href={userProfileUrl} className="shrink-0 mt-0.5">
          {commentProfile?.avatar_url || comment.user_avatar ? (
            <img
              src={commentProfile?.avatar_url || comment.user_avatar}
              alt=""
              className="w-6 h-6 rounded-full object-cover shadow-sm hover:opacity-80 transition cursor-pointer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#222] flex items-center justify-center text-[10px] text-gray-500 shadow-sm cursor-pointer">
              <User className="w-3 h-3" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0 w-full">
          <div className="leading-snug break-words">
            <Link
              href={userProfileUrl}
              className="font-bold text-[13px] text-gray-900 dark:text-gray-100 mr-1.5 inline-flex items-center gap-1 hover:text-blue-500 transition cursor-pointer"
            >
              {currentName}
              {comment.user_email?.toLowerCase().trim() ===
                ADMIN_EMAIL.toLowerCase().trim() && (
                <Shield className="w-3 h-3 text-blue-500 shrink-0" />
              )}
            </Link>
            {!isEditing && (
              <span className="text-[13px] text-gray-700 dark:text-gray-300 font-normal">
                {comment.content}
              </span>
            )}
          </div>
          {isEditing && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <input
                type="text"
                value={editingCommentText}
                onChange={(e) => setEditingCommentText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSaveEditedComment(comment.id)
                }
                className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSaveEditedComment(comment.id)}
                className="p-1 text-emerald-500 hover:bg-emerald-50 rounded cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditingCommentId(null)}
                className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              <span>
                {new Date(comment.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {!isBanned && (
                <button
                  onClick={() => {
                    setReplyingToComment(comment);
                    setNewCommentText("");
                    setTimeout(() => commentInputRef.current?.focus(), 50);
                  }}
                  className="hover:text-gray-700 dark:hover:text-gray-200 transition font-semibold cursor-pointer"
                >
                  Ответить
                </button>
              )}
              {canManage && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  {isOwner && (
                    <button
                      onClick={() => {
                        setEditingCommentId(comment.id);
                        setEditingCommentText(comment.content);
                      }}
                      className="hover:text-blue-500 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNestedComments = (
    parentId: string | null,
    allPostComments: Comment[],
    depth = 0,
  ) => {
    const currentLevelComments = allPostComments.filter(
      (c) => String(c.parent_id || null) === String(parentId || null),
    );
    if (currentLevelComments.length === 0) return null;
    return (
      <div className="space-y-1.5">
        {currentLevelComments.map((comment) => (
          <div key={comment.id} className="space-y-1.5">
            {renderSingleComment(comment, depth)}
            {renderNestedComments(comment.id, allPostComments, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  const nowIsoString = new Date().toISOString();
  const adminStories = stories.filter(
    (s) => s.user_email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  );
  const activeAdminStories = adminStories.filter(
    (s) => s.expires_at > nowIsoString,
  );
  const hasActiveAdminStory = activeAdminStories.length > 0;

  const hasUnseenAdminStory =
    hasActiveAdminStory &&
    session?.user?.email &&
    activeAdminStories.some(
      (s) =>
        !storyViews.some(
          (v) =>
            String(v.story_id) === String(s.id) &&
            v.viewer_email.toLowerCase() === myEmail,
        ),
    );
  const adminProfile = profiles[ADMIN_EMAIL.toLowerCase()];
  const adminAvatar = adminProfile?.avatar_url || "/avatar-placeholder.png";

  return (
    <div className="w-full min-h-screen relative flex flex-col bg-[#f0f2f5] dark:bg-[#0a0a0a] text-black dark:text-white select-none">
      {/* 🔴 LIKELAR MODALI */}
      {showLikesModalForPostId !== null && isAdmin && (
        <div
          onClick={() => setShowLikesModalForPostId(null)}
          className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <span className="font-bold text-xs text-gray-900 dark:text-gray-100">
                  Кто поставил лайк (
                  {
                    reactions.filter(
                      (r) =>
                        String(r.post_id) === String(showLikesModalForPostId),
                    ).length
                  }
                  )
                </span>
              </div>
              <button
                onClick={() => setShowLikesModalForPostId(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {reactions.filter(
                (r) => String(r.post_id) === String(showLikesModalForPostId),
              ).length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-6">
                  Нет реакций
                </p>
              ) : (
                reactions
                  .filter(
                    (r) =>
                      String(r.post_id) === String(showLikesModalForPostId),
                  )
                  .map((r) => {
                    const likerProf =
                      profiles[r.user_email.toLowerCase().trim()];
                    const lName = likerProf?.username
                      ? `@${likerProf.username}`
                      : likerProf?.full_name || r.user_email.split("@")[0];
                    return (
                      <Link
                        key={r.id || r.user_email}
                        href={`/profile/${encodeURIComponent(r.user_email)}`}
                        onClick={() => setShowLikesModalForPostId(null)}
                        className="p-3 bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-between hover:border-blue-500/40 transition group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={
                              likerProf?.avatar_url || "/avatar-placeholder.png"
                            }
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-500 transition">
                              {lName}
                            </p>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono block">
                              {r.created_at
                                ? new Date(r.created_at).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Только что"}
                            </span>
                          </div>
                        </div>
                        <Heart className="w-4 h-4 text-red-500 fill-red-500 shrink-0" />
                      </Link>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {showVideoRecorder && isAdmin && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-[2rem] p-6 shadow-2xl flex flex-col items-center w-full max-w-sm space-y-6">
            <div className="w-full flex justify-between items-center px-1">
              <span className="text-gray-900 dark:text-white font-bold text-sm tracking-wide">
                Запись видеосообщения
              </span>
              <button
                onClick={closeVideoRecorder}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden bg-black border-4 border-gray-200 dark:border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
              <video
                ref={liveVideoRef}
                className={`w-full h-full object-cover ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
                muted
                playsInline
              />
              {isRecording && (
                <div className="absolute top-6 right-6 w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse border-2 border-white/20 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              )}
            </div>

            <div className="flex items-center gap-8 pt-4 pb-2">
              <button
                onClick={toggleCamera}
                disabled={isRecording}
                title="Повернуть камеру"
                className="p-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-full transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              {!isRecording ? (
                <button
                  onClick={startRecording}
                  title="Начать запись"
                  className="w-[72px] h-[72px] bg-gray-100 dark:bg-white rounded-full flex items-center justify-center p-1.5 transition active:scale-95 group shadow-lg cursor-pointer"
                >
                  <div className="w-full h-full bg-red-500 rounded-full group-hover:scale-95 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  title="Остановить и отправить"
                  className="w-[72px] h-[72px] bg-gray-100 dark:bg-white rounded-full flex items-center justify-center p-5 transition active:scale-95 group shadow-lg cursor-pointer"
                >
                  <div className="w-full h-full bg-red-500 rounded-md group-hover:scale-95 transition-transform" />
                </button>
              )}

              <div className="w-12 h-12" />
            </div>
          </div>
        </div>
      )}

      {selectedMedia && (
        <div
          onClick={() => setSelectedMedia(null)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
          >
            {selectedMedia.type === "video" || isVideoUrl(selectedMedia.url) ? (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl bg-black"
              />
            ) : (
              <img
                src={selectedMedia.url}
                alt=""
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl pointer-events-none"
              />
            )}
          </div>
        </div>
      )}

      {showCreateStory && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-sm w-full bg-white dark:bg-[#121212] rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                Новая история
              </span>
              <button
                onClick={() => {
                  setShowCreateStory(false);
                  setStoryFile(null);
                  setStoryPreview(null);
                }}
                className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {storyPreview && (
              <div className="relative w-full aspect-[9/16] max-h-[380px] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-gray-200 dark:border-gray-800">
                {storyFile?.type.startsWith("video/") ? (
                  <video
                    src={storyPreview}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={storyPreview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
            <form onSubmit={handleUploadStory} className="space-y-3">
              <input
                type="text"
                value={storyCaption}
                onChange={(e) => setStoryCaption(e.target.value)}
                placeholder="Подпись к истории..."
                className="w-full bg-[#f5f6f8] dark:bg-black border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex items-center justify-between p-2.5 bg-[#f5f6f8] dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs">
                <span className="font-semibold flex items-center gap-1.5 text-gray-600 dark:text-gray-500">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" /> Срок
                  показа:
                </span>
                <select
                  value={storyDays}
                  onChange={(e) => setStoryDays(Number(e.target.value))}
                  className="bg-transparent font-bold text-blue-600 dark:text-blue-400 focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => (
                    <option
                      key={d}
                      value={d}
                      className="bg-white dark:bg-black text-black dark:text-white"
                    >
                      {d} {d === 1 ? "день" : d < 5 ? "дня" : "дней"}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isUploadingStory}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isUploadingStory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Публикация...</span>
                  </>
                ) : (
                  "Опубликовать историю"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hikoyalar qismi umuman o'zgarmasligi maqsadga muvofiq, u to'liq ekranli media pleyer */}
      {viewingUserEmail && currentStory && (
        <div
          className="fixed inset-0 z-[120] bg-black flex items-center justify-center select-none animate-in fade-in duration-200"
          onMouseDown={() => setIsStoryPaused(true)}
          onMouseUp={() => setIsStoryPaused(false)}
          onTouchStart={() => setIsStoryPaused(true)}
          onTouchEnd={() => setIsStoryPaused(false)}
        >
          <div className="relative w-full max-w-md h-full sm:h-[92vh] sm:rounded-3xl overflow-hidden bg-[#0a0a0a] flex flex-col justify-between shadow-2xl border border-white/10">
            <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
              {activeStories.map((s, idx) => {
                const isPassed = idx < activeStoryIndex;
                const isCurrent = idx === activeStoryIndex;
                return (
                  <div
                    key={`${s.id}_${idx}`}
                    className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-white transition-all"
                      style={{
                        width: isPassed
                          ? "100%"
                          : isCurrent
                            ? `${storyProgress}%`
                            : "0%",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="absolute top-6 inset-x-4 z-30 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Link
                  href={`/profile/${encodeURIComponent(currentStory.user_email)}`}
                  className="flex items-center gap-2.5 hover:opacity-80 transition cursor-pointer"
                  onClick={() => setViewingUserEmail(null)}
                >
                  <img
                    src={
                      profiles[currentStory.user_email]?.avatar_url ||
                      "/avatar-placeholder.png"
                    }
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-white/40"
                  />
                  <div className="leading-tight text-left">
                    <p className="text-xs font-bold truncate max-w-[140px]">
                      {profiles[currentStory.user_email]?.username
                        ? `@${profiles[currentStory.user_email].username}`
                        : profiles[currentStory.user_email]?.full_name ||
                          "Пользователь"}
                    </p>
                    <p className="text-[10px] text-white/70">
                      {new Date(currentStory.created_at).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </p>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                {(currentStory.user_email.toLowerCase().trim() === myEmail ||
                  isAdmin) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStory(currentStory.id);
                    }}
                    className="p-1.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-red-500 transition text-white cursor-pointer"
                    title="Удалить историю"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingUserEmail(null);
                  }}
                  className="p-1.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-white/20 transition text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
              {!isMediaLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
              {currentStory.media_type === "video" ? (
                <video
                  ref={videoRef}
                  src={currentStory.media_url}
                  autoPlay
                  playsInline
                  muted={false}
                  onLoadedData={() => setIsMediaLoaded(true)}
                  onLoadedMetadata={(e) => {
                    setVideoDuration(e.currentTarget.duration || 5);
                    setIsMediaLoaded(true);
                  }}
                  className={`w-full h-full object-contain transition-opacity duration-300 ${
                    isMediaLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onEnded={() => {
                    if (activeStoryIndex < activeStories.length - 1) {
                      setIsMediaLoaded(false);
                      setActiveStoryIndex((i) => i + 1);
                      setStoryProgress(0);
                    } else {
                      setViewingUserEmail(null);
                    }
                  }}
                />
              ) : (
                <img
                  src={currentStory.media_url}
                  alt=""
                  onLoad={() => setIsMediaLoaded(true)}
                  className={`w-full h-full object-contain transition-opacity duration-300 ${
                    isMediaLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
              <div
                className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeStoryIndex > 0) {
                    setIsMediaLoaded(false);
                    setActiveStoryIndex((i) => i - 1);
                    setStoryProgress(0);
                  }
                }}
              />
              <div
                className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeStoryIndex < activeStories.length - 1) {
                    setIsMediaLoaded(false);
                    setActiveStoryIndex((i) => i + 1);
                    setStoryProgress(0);
                  } else {
                    setViewingUserEmail(null);
                  }
                }}
              />
            </div>

            <div className="absolute bottom-4 inset-x-4 z-30 flex flex-col gap-2.5 pointer-events-auto">
              {currentStory.caption && (
                <div className="p-3 bg-black/60 backdrop-blur-md rounded-2xl text-white text-xs leading-relaxed text-center pointer-events-none">
                  {currentStory.caption}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                {currentStory.user_email.toLowerCase().trim() === myEmail ||
                isAdmin ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowViewersList(true);
                    }}
                    className="flex items-center gap-4 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white text-xs font-semibold transition active:scale-95 border border-white/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-blue-400" />
                      <span>{getUniqueStoryViews(currentStory.id).length}</span>
                    </div>
                    <div className="w-[1px] h-3 bg-white/30"></div>
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      <span>
                        {
                          storyLikes.filter(
                            (l) =>
                              String(l.story_id) === String(currentStory.id),
                          ).length
                        }
                      </span>
                    </div>
                  </button>
                ) : (
                  <div />
                )}

                {!isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStoryLike(currentStory.id, currentStory.user_email);
                    }}
                    className={`p-2.5 rounded-full backdrop-blur-md transition active:scale-75 flex items-center justify-center shadow-lg border border-white/10 cursor-pointer ${
                      storyLikes.some(
                        (l) =>
                          String(l.story_id) === String(currentStory.id) &&
                          l.user_email.toLowerCase().trim() === myEmail,
                      )
                        ? "bg-red-600 text-white shadow-red-500/50"
                        : "bg-black/60 hover:bg-black/80 text-white"
                    }`}
                    title="Нравится"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        storyLikes.some(
                          (l) =>
                            String(l.story_id) === String(currentStory.id) &&
                            l.user_email.toLowerCase().trim() === myEmail,
                        )
                          ? "fill-white stroke-white scale-110"
                          : "fill-transparent stroke-white"
                      } transition-all duration-200`}
                    />
                  </button>
                )}
              </div>
            </div>

            {showViewersList &&
              (currentStory.user_email.toLowerCase().trim() === myEmail ||
                isAdmin) && (
                <div className="absolute inset-0 z-40 bg-black/95 backdrop-blur-md p-5 flex flex-col animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-blue-400" /> Просмотры (
                      {getUniqueStoryViews(currentStory.id).length})
                    </span>
                    <button
                      onClick={() => setShowViewersList(false)}
                      className="p-1 rounded-full text-white/70 hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {getUniqueStoryViews(currentStory.id).length === 0 ? (
                      <p className="text-xs text-center text-white/50 py-8">
                        Пока никто не просмотрел
                      </p>
                    ) : (
                      getUniqueStoryViews(currentStory.id).map((vw) => {
                        const viewerProf =
                          profiles[vw.viewer_email.toLowerCase().trim()];
                        const vName = viewerProf?.username
                          ? `@${viewerProf.username}`
                          : viewerProf?.full_name ||
                            vw.viewer_email.split("@")[0];

                        const isUserLiked = storyLikes.some(
                          (l) =>
                            String(l.story_id) === String(currentStory.id) &&
                            l.user_email.toLowerCase().trim() ===
                              vw.viewer_email.toLowerCase().trim(),
                        );

                        return (
                          <Link
                            key={vw.id || `${vw.story_id}_${vw.viewer_email}`}
                            href={`/profile/${encodeURIComponent(vw.viewer_email)}`}
                            onClick={() => {
                              setShowViewersList(false);
                              setViewingUserEmail(null);
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-2xl hover:border-blue-500/40 transition group cursor-pointer ${
                              isUserLiked
                                ? "bg-red-500/10 border border-red-500/20"
                                : "bg-white/5 border border-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  viewerProf?.avatar_url ||
                                  "/avatar-placeholder.png"
                                }
                                alt=""
                                className="w-9 h-9 rounded-full object-cover border border-white/20 group-hover:opacity-80 transition"
                              />
                              <div className="leading-tight">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-blue-400 transition">
                                  {vName}
                                </span>
                                <span className="text-[10px] text-white/50">
                                  {new Date(vw.viewed_at).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                            {isUserLiked && (
                              <div className="flex items-center gap-1 pr-1">
                                <Heart className="w-4 h-4 fill-red-500 text-red-500 animate-pulse" />
                              </div>
                            )}
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* HEADER - Professional Minimalist & Soft Light */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 dark:bg-[#0f0f0f]/80 border-b border-gray-200 dark:border-gray-800/60 px-4 py-3 flex justify-between items-center max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={storyFileInputRef}
            onChange={handleSelectStoryFile}
            accept="image/*,video/*"
            className="hidden"
          />

          {(hasActiveAdminStory || isAdmin) && (
            <div
              className="relative flex-shrink-0 cursor-pointer group"
              onClick={() => {
                if (!session?.user?.email) {
                  router.push("/login");
                  return;
                }
                if (hasActiveAdminStory) {
                  handleOpenStory(ADMIN_EMAIL.toLowerCase(), 0);
                } else if (isAdmin) {
                  storyFileInputRef.current?.click();
                }
              }}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 transition active:scale-95 flex items-center justify-center ${
                  hasActiveAdminStory
                    ? hasUnseenAdminStory
                      ? "bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[2px] animate-pulse"
                      : "border-2 border-gray-300 dark:border-gray-700"
                    : "border-2 border-dashed border-gray-300 dark:border-gray-700"
                }`}
              >
                <img
                  src={adminAvatar}
                  alt="Admin"
                  className="w-full h-full rounded-full object-cover bg-gray-100 dark:bg-black"
                />
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!session?.user?.email) {
                      router.push("/login");
                      return;
                    }
                    storyFileInputRef.current?.click();
                  }}
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center border-[2px] border-white dark:border-black shadow-md hover:bg-blue-500 cursor-pointer z-10"
                >
                  <Plus className="w-2.5 h-2.5 font-bold" />
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col">
            <span className="font-extrabold text-[19px] tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent leading-none">
              Urokov
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {session && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-[#222] rounded-xl transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-2">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-xs text-gray-900 dark:text-white">
                        Уведомления
                      </span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={async () => {
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, is_read: true })),
                          );
                          await supabase
                            .from("notifications")
                            .update({ is_read: true })
                            .eq("user_email", session.user.email);
                        }}
                        className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-500">
                        У вас пока нет новых уведомлений
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 rounded-xl cursor-pointer transition ${
                            n.is_read
                              ? "bg-gray-50 dark:bg-[#222]/50 opacity-70"
                              : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20"
                          } hover:opacity-100 flex flex-col gap-1`}
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-gray-900 dark:text-white">
                              {n.actor_name}
                            </p>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(n.created_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 dark:text-gray-400">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#222] rounded-xl transition text-blue-500 dark:text-blue-400 cursor-pointer"
            >
              <Shield className="w-5 h-5" />
            </Link>
          )}
          {session ? (
            <Link
              href="/profile"
              className="flex items-center justify-center rounded-full hover:opacity-80 transition active:scale-95 cursor-pointer"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-700 pointer-events-none"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#222] flex items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300">
                  <User className="w-4 h-4" />
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded-full hover:opacity-90 transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Войти</span>
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 relative z-10 max-w-xl w-full mx-auto flex flex-col pb-24">
        {isBanned && (
          <div className="m-4 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-rose-600 dark:text-rose-300 flex items-center gap-3 shadow-sm">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
            <div className="text-xs font-semibold leading-relaxed">
              Ваш аккаунт заблокирован модератором. Вы не можете оставлять
              комментарии и ставить реакции.
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="bg-white dark:bg-[#181818] p-4 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            {!showQuickPost ? (
              <button
                onClick={() => setShowQuickPost(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold rounded-xl text-xs hover:bg-blue-100 dark:hover:bg-blue-600/20 transition active:scale-95 border border-blue-200 dark:border-blue-500/20 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Создать новую публикацию
              </button>
            ) : (
              <form onSubmit={handleSaveQuickPost} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    {editingPostId
                      ? "Редактирование публикации"
                      : "Новая публикация"}
                  </span>
                  <button
                    type="button"
                    onClick={resetPostForm}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Закрыть
                  </button>
                </div>
                <textarea
                  value={quickPostContent}
                  onChange={(e) => setQuickPostContent(e.target.value)}
                  placeholder="Что нового? (текст)..."
                  className="w-full bg-[#f5f6f8] dark:bg-[#111] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px] resize-none"
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={quickIsPinned}
                    onChange={(e) => setQuickIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 bg-white dark:bg-[#111]"
                  />
                  <span>📌 Закрепить публикацию в начале ленты</span>
                </label>
                {quickMediaUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 p-2 bg-[#f5f6f8] dark:bg-[#111] rounded-xl border border-gray-200 dark:border-gray-800">
                    {quickMediaUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-lg overflow-hidden aspect-square bg-black/5 dark:bg-black/40 flex items-center justify-center"
                      >
                        {isVideoUrl(url) ? (
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                          />
                        ) : isAudioUrl(url) ? (
                          <div className="w-full h-full flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400">
                            <Volume2 className="w-5 h-5" />
                          </div>
                        ) : isDocumentUrl(url) ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                            <FileText className="w-5 h-5 mb-1" />
                            <span className="text-[8px] font-mono truncate px-1 w-full text-center">
                              {getCleanFileName(url)}
                            </span>
                          </div>
                        ) : (
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setQuickMediaUrls((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="absolute top-1 right-1 p-1 bg-black/60 dark:bg-black/80 text-white rounded-full hover:scale-110 active:scale-95 transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleMultipleFileUpload}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.csv"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#f5f6f8] dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-blue-500 transition disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 animate-spin" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    )}
                    <span className="hidden sm:inline">
                      {uploadingFile ? uploadProgressText : "Файлы"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowVideoRecorder(true);
                      startCamera(facingMode);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/40 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:border-rose-500 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Кружок</span>
                  </button>

                  <input
                    ref={linkInputRef}
                    type="url"
                    placeholder="Ссылка..."
                    className="flex-1 bg-[#f5f6f8] dark:bg-[#111] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-40 cursor-pointer"
                >
                  {isSubmittingPost
                    ? "Публикация..."
                    : editingPostId
                      ? "Сохранить"
                      : "Опубликовать"}
                </button>
              </form>
            )}
          </div>
        )}

        {sortedPosts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 min-h-[40vh]">
            <p className="font-medium text-gray-500 dark:text-gray-400 text-center text-xs">
              Пока нет публикаций
            </p>
          </div>
        ) : (
          <div className="flex flex-col pb-20">
            {sortedPosts.map((post) => {
              const postReactions = reactions.filter(
                (r) => String(r.post_id) === String(post.id),
              );
              const isLiked = session?.user?.email
                ? postReactions.some(
                    (r) =>
                      r.user_email.toLowerCase().trim() ===
                      session.user.email?.toLowerCase().trim(),
                  )
                : false;
              const postComments = comments.filter(
                (c) => String(c.post_id) === String(post.id),
              );
              const isCommentOpen = activeCommentPostId === post.id;
              const mediaList = post.media_url
                ? post.media_url
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [];

              const isVideoMessage =
                post.media_type === "video_message" && mediaList.length === 1;

              const postDate = new Date(post.created_at);
              const formattedDate = postDate.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <article
                  key={post.id}
                  ref={(el) => {
                    postRefs.current[post.id] = el as HTMLElement | null;
                  }}
                  className={`bg-white dark:bg-[#0a0a0a] px-4 py-4 sm:px-5 sm:py-5 border-b border-gray-200 dark:border-gray-900 relative group transition-colors ${
                    post.is_pinned ? "bg-blue-50/40 dark:bg-blue-900/5" : ""
                  }`}
                >
                  {/* POST HEADER: MUALLIF VA VAQT */}
                  <div className="flex justify-between items-start mb-3">
                    <Link
                      href={`/profile/${encodeURIComponent(ADMIN_EMAIL)}`}
                      className="flex gap-2.5 items-center hover:opacity-80 transition cursor-pointer"
                    >
                      <img
                        src={adminAvatar}
                        alt="Urokov"
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-800"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100 leading-none group-hover:text-blue-500 dark:group-hover:text-blue-400 transition">
                            Urokov
                          </span>
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                          {post.is_pinned && (
                            <Pin className="w-3 h-3 ml-1 text-blue-500 fill-current rotate-45" />
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-500 font-mono mt-1">
                          {formattedDate}
                        </span>
                      </div>
                    </Link>

                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition z-20">
                        <button
                          onClick={() => handleTogglePin(post)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full transition cursor-pointer"
                          title={post.is_pinned ? "Открепить" : "Закрепить"}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditPost(post)}
                          className="p-1.5 text-gray-400 hover:text-green-500 rounded-full transition cursor-pointer"
                          title="Редактировать"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-full transition cursor-pointer"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isVideoMessage ? (
                    <div className="flex justify-center w-full">
                      <TelegramVideoMessage src={mediaList[0]} />
                    </div>
                  ) : (
                    mediaList.length > 0 && (
                      <div className="mb-3">
                        {mediaList.length === 1 ? (
                          <div>
                            {getYouTubeVideoId(mediaList[0]) ? (
                              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-900 bg-black">
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${getYouTubeVideoId(mediaList[0])}`}
                                  title="YouTube video player"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="w-full h-full border-0"
                                />
                              </div>
                            ) : isAudioUrl(mediaList[0]) ? (
                              <TelegramAudioPlayer src={mediaList[0]} />
                            ) : isVideoUrl(mediaList[0]) ? (
                              <TelegramVideoCard
                                src={mediaList[0]}
                                onClick={() =>
                                  setSelectedMedia({
                                    url: mediaList[0],
                                    type: "video",
                                  })
                                }
                              />
                            ) : isDocumentUrl(mediaList[0]) ? (
                              <TelegramDocumentCard url={mediaList[0]} />
                            ) : (
                              <TelegramImageCard
                                src={mediaList[0]}
                                onClick={() =>
                                  setSelectedMedia({
                                    url: mediaList[0],
                                    type: "image",
                                  })
                                }
                              />
                            )}
                          </div>
                        ) : (
                          <InstagramCarousel
                            urls={mediaList}
                            onImageClick={(url, type) =>
                              setSelectedMedia({ url, type })
                            }
                          />
                        )}
                      </div>
                    )
                  )}

                  {post.content && (
                    <div className="text-[15px] leading-snug">
                      {renderContentWithEmbeds(post.content)}
                    </div>
                  )}

                  {/* LIKES & COMMENTS BUTTONS */}
                  <div className="flex items-center gap-5 mt-3 text-gray-500 select-none">
                    <div className="flex items-center gap-1.5 group/btn cursor-pointer">
                      <button
                        onClick={() => handleReaction(post.id)}
                        className={`p-1.5 rounded-full transition ${
                          isLiked ? "bg-red-500/10" : "hover:bg-red-500/10"
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 transition ${
                            isLiked
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400 group-hover/btn:text-red-500"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => {
                          if (isAdmin && postReactions.length > 0)
                            setShowLikesModalForPostId(post.id);
                        }}
                        className={`text-[13px] font-medium transition ${
                          isAdmin && postReactions.length > 0
                            ? "hover:text-red-500 cursor-pointer text-gray-700 dark:text-gray-200"
                            : "cursor-default text-gray-500"
                        }`}
                      >
                        {postReactions.length > 0 ? postReactions.length : ""}
                      </button>
                    </div>

                    <div
                      className="flex items-center gap-1.5 group/btn cursor-pointer"
                      onClick={() =>
                        setActiveCommentPostId(
                          activeCommentPostId === post.id ? null : post.id,
                        )
                      }
                    >
                      <button
                        className={`p-1.5 rounded-full transition ${
                          isCommentOpen
                            ? "bg-blue-500/10"
                            : "hover:bg-blue-500/10"
                        }`}
                      >
                        <MessageSquare
                          className={`w-5 h-5 transition ${
                            isCommentOpen
                              ? "text-blue-500 fill-blue-500/20"
                              : "text-gray-400 group-hover/btn:text-blue-500"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-[13px] font-medium transition ${
                          isCommentOpen
                            ? "text-blue-500"
                            : "group-hover/btn:text-blue-500 text-gray-500"
                        }`}
                      >
                        {postComments.length > 0 ? postComments.length : ""}
                      </span>
                    </div>
                  </div>

                  {isCommentOpen && (
                    <div className="mt-2 pt-2 space-y-2 animate-in fade-in">
                      {replyingToComment && (
                        <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-blue-600 dark:text-blue-400 mb-2">
                          <span className="truncate">
                            Ответ:{" "}
                            <strong className="font-semibold">
                              @
                              {(
                                profiles[
                                  replyingToComment.user_email
                                    .toLowerCase()
                                    .trim()
                                ]?.username ||
                                profiles[
                                  replyingToComment.user_email
                                    .toLowerCase()
                                    .trim()
                                ]?.full_name ||
                                replyingToComment.user_name
                              ).replace(/^@/, "")}
                            </strong>
                          </span>
                          <button
                            onClick={() => {
                              setReplyingToComment(null);
                              setNewCommentText("");
                            }}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {!isBanned ? (
                        <div className="flex gap-2 items-center">
                          <input
                            ref={commentInputRef}
                            type="text"
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleAddComment(post.id)
                            }
                            placeholder="Комментарий..."
                            className="flex-1 bg-[#f5f6f8] dark:bg-[#111] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={
                              isSubmittingComment || !newCommentText.trim()
                            }
                            className="p-2 bg-blue-500 text-white dark:bg-white dark:text-black rounded-xl hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold px-2 py-1 text-center bg-rose-50 dark:bg-rose-950/20 rounded-xl">
                          Комментирование недоступно
                        </div>
                      )}
                      {postComments.length > 0 ? (
                        <div className="pt-2">
                          {renderNestedComments(null, postComments)}
                        </div>
                      ) : (
                        <p className="text-[11px] text-center text-gray-500 py-2">
                          Комментариев пока нет
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      <ChatHub session={session} isBanned={isBanned} profiles={profiles} />
    </div>
  );
}
