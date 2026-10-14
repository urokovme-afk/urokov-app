"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { ThemeToggle } from "../components/theme-toggle";
import { WorkCard, WorkPost } from "../components/work-card";
import { MediaLightbox } from "../components/media-lightbox";
import { SecretAdminModal } from "../components/secret-admin-modal";
import { Upload3DModal } from "../components/upload-3d-modal";
import {
  Plus,
  LogOut,
  Layers,
  Loader2,
  Box,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

const ADMIN_EMAIL = "urokov.me@gmail.com";
const CACHE_KEY = "urokov_3d_posts_cache_v2";

export default function HomePage() {
  // Boshlang'ich holat server va klientda bir xil bo'lishi kerak (Hydration xatosini oldini olish uchun)
  const [posts, setPosts] = useState<WorkPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [session, setSession] = useState<Session | null>(null);

  // Modallar
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activePost, setActivePost] = useState<WorkPost | null>(null);

  // Logo 3 marta bosilganda yashirin admin ochilishi uchun
  const logoClickRef = useRef<{ count: number; timer: NodeJS.Timeout | null }>({
    count: 0,
    timer: null,
  });

  const myEmail = session?.user?.email?.toLowerCase().trim() || "";
  const isAdmin = myEmail === ADMIN_EMAIL.toLowerCase().trim();

  // 1. Postlarni Supabase'dan olish (faqat asinxron chaqiruv)
  const refetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const visualPosts = (data as WorkPost[]).filter((p) => {
          if (!p.media_url) return false;
          const urlClean = p.media_url.split("?")[0].toLowerCase();
          return (
            p.media_type === "video" ||
            p.media_type === "image" ||
            /\.(mp4|webm|mov|m4v|png|jpg|jpeg|webp|gif)$/i.test(urlClean)
          );
        });

        setPosts(visualPosts);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(visualPosts));
        } catch {}
      }
    } catch (err) {
      console.error("Posts fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Auth holatini tekshirish va dastlabki ma'lumotlarni asinxron yuklash
  useEffect(() => {
    let isMounted = true;

    // Keshni klientda hydration tugagandan so'ng mikrotaskda yuklash
    Promise.resolve().then(() => {
      if (!isMounted) return;
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPosts(parsed);
            setLoading(false);
          }
        }
      } catch {}
    });

    supabase.auth.getSession().then(({ data: { session: curSession } }) => {
      if (isMounted) setSession(curSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, curSession) => {
      if (isMounted) setSession(curSession);
    });

    supabase
      .from("posts")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (!error && data) {
          const visualPosts = (data as WorkPost[]).filter((p) => {
            if (!p.media_url) return false;
            const urlClean = p.media_url.split("?")[0].toLowerCase();
            return (
              p.media_type === "video" ||
              p.media_type === "image" ||
              /\.(mp4|webm|mov|m4v|png|jpg|jpeg|webp|gif)$/i.test(urlClean)
            );
          });
          setPosts(visualPosts);
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(visualPosts));
          } catch {}
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 3. Yashirin klaviatura kombinatsiyasi: Ctrl + Shift + U
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.shiftKey &&
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "u" || e.key.toLowerCase() === "a")
      ) {
        e.preventDefault();
        setIsSecretModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Logo 3 marta bosilganda
  const handleLogoClick = () => {
    if (logoClickRef.current.timer) {
      clearTimeout(logoClickRef.current.timer);
    }

    logoClickRef.current.count += 1;

    if (logoClickRef.current.count >= 3) {
      logoClickRef.current.count = 0;
      setIsSecretModalOpen(true);
      return;
    }

    logoClickRef.current.timer = setTimeout(() => {
      logoClickRef.current.count = 0;
    }, 1200);
  };

  // Postni o'chirish (Admin)
  const handleDeletePost = async (id: number) => {
    const targetPost = posts.find((p) => p.id === id);

    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (!error) {
      const updated = posts.filter((p) => p.id !== id);
      setPosts(updated);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      } catch {}

      if (
        targetPost?.media_url &&
        targetPost.media_url.includes("/storage/v1/object/public/media/")
      ) {
        const rawPath = targetPost.media_url.split(
          "/storage/v1/object/public/media/"
        )[1];
        if (rawPath) {
          supabase.storage
            .from("media")
            .remove([decodeURIComponent(rawPath)])
            .catch(() => {});
        }
      }
    }
  };

  // Postni pin qilish (Admin)
  const handleTogglePin = async (id: number, currentPinned: boolean) => {
    const newPinned = !currentPinned;
    const { error } = await supabase
      .from("posts")
      .update({ is_pinned: newPinned })
      .eq("id", id);

    if (!error) {
      const updated = posts
        .map((p) => (p.id === id ? { ...p, is_pinned: newPinned } : p))
        .sort((a, b) => Number(b.is_pinned || 0) - Number(a.is_pinned || 0));
      setPosts(updated);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      } catch {}
    }
  };

  // Chiqish (Admin)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
      {/* ⚡ JIDDIY VA ZAMONAVIY HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/80 dark:bg-black/85 border-b border-gray-200/80 dark:border-zinc-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors">
        {/* LOGO & BRAND (3 marta bosilganda yashirin admin ochiladi) */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none group"
          title="Urokov 3D Studio"
        >
          {/* Geometrik 3D Studio Belgisi */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-900 to-black dark:from-zinc-800 dark:to-zinc-950 border border-zinc-700/60 dark:border-zinc-700/50 flex items-center justify-center shadow-inner group-hover:border-cyan-500/60 transition-all duration-300">
            <Box className="w-4 h-4 text-zinc-300 dark:text-zinc-100 group-hover:text-cyan-400 group-hover:rotate-12 transition-all duration-300" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </div>

          <div className="flex flex-col">
            <span className="font-black text-base sm:text-[17px] tracking-[0.22em] text-zinc-900 dark:text-white uppercase leading-none group-hover:text-cyan-400 transition-colors duration-200">
              UROKOV
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-mono tracking-[0.18em] text-zinc-600 uppercase">
                MOTION LAB
              </span>
              <span className="text-zinc-600 text-[8px]">•</span>
              <span className="text-[9px] font-mono tracking-wider text-cyan-500">
                3D
              </span>
            </div>
          </div>
        </div>

        {/* Header o&apos;ng tomoni */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold tracking-wide transition shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Yuklash</span>
            </button>
          )}

          <ThemeToggle />
        </div>
      </header>

      {/* ⚡ ADMIN BAR (Faqat admin uchun) */}
      {isAdmin && (
        <section className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-[11px] text-zinc-400">
              Admin: <strong className="text-zinc-200">{ADMIN_EMAIL}</strong>
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="hover:text-rose-400 flex items-center gap-1 text-[11px] transition"
          >
            <LogOut className="w-3 h-3" />
            <span>Chiqish</span>
          </button>
        </section>
      )}

      {/* ⚡ 2 TA USTUNLI KO'RINISH (2-Column Grid) */}
      <main className="flex-1 p-3 sm:p-4">
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            <span className="text-xs font-mono text-zinc-500">
              3D galereya yuklanmoqda...
            </span>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-2 select-none">
            <Layers className="w-8 h-8 text-zinc-600 mb-1" />
            <h3 className="text-sm font-semibold text-zinc-300">
              Galereya bo&apos;sh
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs">
              {isAdmin
                ? "Yuqoridagi 'Yuklash' tugmasi orqali yangi 3D animatsiyangizni joylang."
                : "Tez orada yangi 3D animatsiyalar yuklanadi."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
            {posts.map((post) => (
              <WorkCard
                key={post.id}
                post={post}
                isAdmin={isAdmin}
                onDelete={handleDeletePost}
                onTogglePin={handleTogglePin}
                onOpenLightbox={(p) => setActivePost(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ⚡ JIDDIY VA MINIMALIST FOOTER */}
      <footer className="mt-8 border-t border-gray-200 dark:border-zinc-800/80 px-4 py-6 flex flex-col items-center justify-center gap-2 text-center select-none bg-gray-50/50 dark:bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black tracking-[0.25em] uppercase text-zinc-400">
            UROKOV
          </span>
          <span className="text-[10px] font-mono text-zinc-600">·</span>
          <span className="text-[11px] font-mono text-zinc-500">
            3D Motion & Visual Lab
          </span>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <span>© {new Date().getFullYear()} Barcha huquqlar himoyalangan</span>
          {/* Yashirin administrator tugmasi (kichkina nuqta) */}
          <button
            onClick={() => setIsSecretModalOpen(true)}
            className="w-1.5 h-1.5 rounded-full bg-transparent hover:bg-zinc-600 transition cursor-default ml-1"
            title="·"
            aria-label="Admin"
          />
        </div>
      </footer>

      {/* ⚡ TELEGRAM-STYLE LIGHTBOX */}
      <MediaLightbox
        isOpen={!!activePost}
        onClose={() => setActivePost(null)}
        mediaUrl={activePost?.media_url || ""}
        mediaType={activePost?.media_type || "video"}
        content={activePost?.content}
        createdAt={activePost?.created_at}
      />

      {/* ⚡ YASHIRIN ADMIN MODAL */}
      <SecretAdminModal
        isOpen={isSecretModalOpen}
        onClose={() => setIsSecretModalOpen(false)}
      />

      {/* ⚡ ADMIN YUKLASH MODALI */}
      <Upload3DModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => refetchPosts()}
      />
    </div>
  );
}
