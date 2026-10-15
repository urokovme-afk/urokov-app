"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
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
const CACHE_KEY = "urokov_3d_posts_cache_v3";

export default function HomePage() {
  // Начальное состояние (одинаковое на сервере и клиенте для предотвращения ошибок гидратации)
  const [posts, setPosts] = useState<WorkPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);

  // Модальные окна
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activePost, setActivePost] = useState<WorkPost | null>(null);

  // Счётчик кликов на логотип для скрытого входа
  const logoClickRef = useRef<{ count: number; timer: NodeJS.Timeout | null }>({
    count: 0,
    timer: null,
  });

  const myEmail = session?.user?.email?.toLowerCase().trim() || "";
  const isAdmin = myEmail === ADMIN_EMAIL.toLowerCase().trim();

  // Функция обновления постов из Supabase
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
            p.media_type === "code" ||
            p.media_type === "video" ||
            p.media_type === "image" ||
            /\.(html|htm|mp4|webm|mov|m4v|png|jpg|jpeg|webp|gif)$/i.test(urlClean)
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

  // Первоначальная загрузка и проверка сессии
  useEffect(() => {
    let isMounted = true;

    // Быстрое чтение кэша в микротаске сразу после гидратации
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

    // Запрос актуальных данных из облака
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
              p.media_type === "code" ||
              p.media_type === "video" ||
              p.media_type === "image" ||
              /\.(html|htm|mp4|webm|mov|m4v|png|jpg|jpeg|webp|gif)$/i.test(urlClean)
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

  // Скрытая комбинация клавиш: Ctrl + Shift + U
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

  // Скрытый вход по тройному клику на логотип
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

  // Удаление работы (для администратора)
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

  // Закрепление работы
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

  // Выход из системы
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-zinc-900 selection:bg-cyan-100 selection:text-cyan-900">
      {/* ⚡ ВЕРХНЯЯ ШАПКА (Светлый минимализм) */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 border-b border-zinc-200/90 px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors">
        {/* ЛОГОТИП (Тройной клик открывает скрытый вход) */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none group"
          title="Urokov 3D Lab"
        >
          {/* Геометрический 3D символ */}
          <div className="relative w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xs group-hover:scale-105 transition-all duration-300">
            <Box className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-300" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
          </div>

          <div className="flex flex-col">
            <span className="font-black text-base sm:text-[17px] tracking-[0.22em] text-zinc-950 uppercase leading-none group-hover:text-cyan-600 transition-colors">
              UROKOV
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-mono tracking-[0.18em] text-zinc-500 uppercase">
                3D & CREATIVE CODING
              </span>
            </div>
          </div>
        </div>

        {/* Правая часть шапки */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold tracking-wide transition shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Загрузить</span>
            </button>
          )}
        </div>
      </header>

      {/* ⚡ ПАНЕЛЬ АДМИНИСТРАТОРА (Видна только для urokov.me@gmail.com) */}
      {isAdmin && (
        <section className="bg-zinc-50 border-b border-zinc-200 px-4 py-2 flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="font-mono text-[11px] text-zinc-500">
              Администратор: <strong className="text-zinc-800">{ADMIN_EMAIL}</strong>
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="hover:text-rose-600 flex items-center gap-1 text-[11px] font-medium transition"
          >
            <LogOut className="w-3 h-3" />
            <span>Выйти</span>
          </button>
        </section>
      )}

      {/* ⚡ ОСНОВНАЯ СЕТКА: 2 КОЛОНКИ (2-Column Grid) */}
      <main className="flex-1 p-3 sm:p-4">
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
            <span className="text-xs font-mono text-zinc-400">
              Загрузка 3D галереи...
            </span>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center gap-2 select-none">
            <Layers className="w-8 h-8 text-zinc-300 mb-1" />
            <h3 className="text-sm font-semibold text-zinc-800">
              Галерея пуста
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              {isAdmin
                ? "Нажмите кнопку «Загрузить», чтобы вставить 3D JavaScript код или файл."
                : "Скоро здесь появятся новые 3D работы и генеративные анимации."}
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

      {/* ⚡ ЛАКОНИЧНЫЙ, СЕРЬЕЗНЫЙ ФУТЕР */}
      <footer className="mt-8 border-t border-zinc-200/80 px-4 py-5 flex items-center justify-center gap-2 text-center select-none bg-zinc-50/60">
        <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
          UROKOV · 3D LAB · {new Date().getFullYear()}
        </span>

        {/* Скрытая точка для входа администратора */}
        <button
          onClick={() => setIsSecretModalOpen(true)}
          className="w-1.5 h-1.5 rounded-full bg-transparent hover:bg-zinc-400 transition cursor-default ml-0.5"
          title="·"
          aria-label="Admin"
        />
      </footer>

      {/* ⚡ ИНТЕРАКТИВНЫЙ LIGHTBOX (Просмотр 3D кода / медиа) */}
      <MediaLightbox
        isOpen={!!activePost}
        onClose={() => setActivePost(null)}
        mediaUrl={activePost?.media_url || ""}
        mediaType={activePost?.media_type || "code"}
        content={activePost?.content}
        createdAt={activePost?.created_at}
      />

      {/* ⚡ СКРЫТЫЙ ВХОД АДМИНИСТРАТОРА */}
      <SecretAdminModal
        isOpen={isSecretModalOpen}
        onClose={() => setIsSecretModalOpen(false)}
      />

      {/* ⚡ МОДАЛКА ДОБАВЛЕНИЯ 3D РАБОТЫ (Код / Файл) */}
      <Upload3DModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => refetchPosts()}
      />
    </div>
  );
}
