"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  PlusCircle,
  Users,
  Eye,
  Trash2,
  Edit3,
  Ban,
  CheckCircle,
  Send,
  X,
  ShieldAlert,
  LogIn,
  ShieldCheck,
  Paperclip,
  Film,
  Image as ImageIcon,
  Loader2,
  History,
  Activity,
  ExternalLink,
  Clock,
  UserX,
  UserCheck,
  FilePlus,
  FileEdit,
  FileX,
  UploadCloud,
  Search,
  KeyRound,
  VolumeX,
} from "lucide-react";
import Link from "next/link";

interface Post {
  id: number;
  content: string;
  media_url?: string;
  media_type?: string;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

interface ActivityLog {
  id: number;
  user_email: string;
  action: string;
  details?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "menu" | "posts" | "users" | "logs"
  >("menu");

  const [posts, setPosts] = useState<Post[]>([]);
  const [postContent, setPostContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<string>("none");
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logSearch, setLogSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ADMIN_EMAIL = "urokov.me@gmail.com";

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchData = useCallback(async () => {
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (postsData) setPosts(postsData);

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (profilesData) setProfiles(profilesData);

    const { data: logsData } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (logsData) setLogs(logsData);
  }, []);

  useEffect(() => {
    const checkUser = async (currSession: Session | null) => {
      if (!currSession) {
        setSession(null);
        setLoading(false);
        return;
      }

      const email = currSession.user.email?.toLowerCase().trim();
      const targetAdmin = ADMIN_EMAIL.toLowerCase().trim();

      if (email === targetAdmin) {
        setSession(currSession);
        setAuthError(null);
        await fetchData();
      } else {
        setSession(null);
        setAuthError(
          `Доступ запрещен. Аккаунт ${email} не имеет прав администратора.`,
        );
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchData]);

  const handleAdminGoogleLogin = async () => {
    setAuthError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin`,
      },
    });
  };

  const logActivity = async (action: string, details?: string) => {
    if (!session?.user?.email) return;
    const newLog = {
      user_email: session.user.email,
      action,
      details: details || "",
    };
    const { data } = await supabase
      .from("activity_logs")
      .insert([newLog])
      .select();
    if (data && data.length > 0) {
      setLogs((prev) => [data[0], ...prev]);
    }
  };

  const getLogMeta = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes("вход") || lower.includes("авториз")) {
      return {
        icon: <KeyRound className="w-4 h-4 text-emerald-500" />,
        bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400",
        badge: "Авторизация",
      };
    }
    if (lower.includes("блок") && !lower.includes("разблок")) {
      return {
        icon: <UserX className="w-4 h-4 text-red-500" />,
        bg: "bg-red-50 dark:bg-red-950/40 border-red-200/60 dark:border-red-900/40 text-red-600 dark:text-red-400",
        badge: "Блокировка",
      };
    }
    if (lower.includes("разблок")) {
      return {
        icon: <UserCheck className="w-4 h-4 text-teal-500" />,
        bg: "bg-teal-50 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-900/40 text-teal-600 dark:text-teal-400",
        badge: "Разблокировка",
      };
    }
    if (lower.includes("звук") || lower.includes("mute")) {
      return {
        icon: <VolumeX className="w-4 h-4 text-orange-500" />,
        bg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-900/40 text-orange-600 dark:text-orange-400",
        badge: "Чат",
      };
    }
    if (lower.includes("создание")) {
      return {
        icon: <FilePlus className="w-4 h-4 text-blue-500" />,
        bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-400",
        badge: "Новый пост",
      };
    }
    if (lower.includes("обновление") || lower.includes("редактир")) {
      return {
        icon: <FileEdit className="w-4 h-4 text-amber-500" />,
        bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40 text-amber-600 dark:text-amber-400",
        badge: "Изменение",
      };
    }
    if (lower.includes("удаление")) {
      return {
        icon: <FileX className="w-4 h-4 text-rose-500" />,
        bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/40 text-rose-600 dark:text-rose-400",
        badge: "Удаление",
      };
    }
    if (lower.includes("медиа") || lower.includes("загрузка")) {
      return {
        icon: <UploadCloud className="w-4 h-4 text-purple-500" />,
        bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-900/40 text-purple-600 dark:text-purple-400",
        badge: "Медиа",
      };
    }
    return {
      icon: <Activity className="w-4 h-4 text-blue-500" />,
      bg: "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300",
      badge: "Событие",
    };
  };

  const cleanLogDetails = (text?: string) => {
    if (!text) return null;
    let formatted = text;
    formatted = formatted.replace(/\|\s*ID профиля:\s*[a-f0-9-]{30,}/gi, "");
    formatted = formatted.replace(/ID профиля:\s*[a-f0-9-]{30,}\s*\|?/gi, "");
    formatted = formatted.replace(/Цель:\s*/gi, "Пользователь: ");
    formatted = formatted.replace(
      /Новый статус:\s*BANNED/gi,
      "Статус: Заблокирован 🚫",
    );
    formatted = formatted.replace(
      /Новый статус:\s*ACTIVE/gi,
      "Статус: Доступ открыт ✅",
    );
    formatted = formatted.replace(/\|\s*\|/g, "|").trim();
    if (formatted.endsWith("|")) formatted = formatted.slice(0, -1).trim();
    return formatted;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    setUploadingFile(true);
    setUploadProgressText(`Загрузка ${fileSizeMB} МБ...`);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) {
        showNotification("error", `Ошибка: ${uploadError.message}`);
        setUploadingFile(false);
        setUploadProgressText("");
        return;
      }

      const { data } = supabase.storage.from("media").getPublicUrl(filePath);
      setMediaUrl(data.publicUrl);
      setMediaType(file.type.startsWith("video/") ? "video" : "image");
      showNotification("success", `Медиа (${fileSizeMB} МБ) загружено!`);
      await logActivity(
        "Загрузка медиа",
        `Загружен ${file.type.startsWith("video/") ? "видео" : "фото"} файл (${fileSizeMB} МБ)`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
      showNotification("error", `Ошибка: ${msg}`);
    } finally {
      setUploadingFile(false);
      setUploadProgressText("");
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!postContent.trim() && !mediaUrl.trim()) || isSubmitting) return;

    setIsSubmitting(true);
    const determinedMediaType = mediaUrl.trim()
      ? mediaType !== "none"
        ? mediaType
        : mediaUrl.match(/\.(mp4|webm|mov)$/i)
          ? "video"
          : "image"
      : "none";

    try {
      if (editingPostId) {
        const { error } = await supabase
          .from("posts")
          .update({
            content: postContent.trim(),
            media_url: mediaUrl.trim() || null,
            media_type: determinedMediaType,
          })
          .eq("id", editingPostId);

        if (error) {
          showNotification("error", error.message);
        } else {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === editingPostId
                ? {
                    ...p,
                    content: postContent.trim(),
                    media_url: mediaUrl.trim() || undefined,
                    media_type: determinedMediaType,
                  }
                : p,
            ),
          );
          showNotification("success", "Публикация обновлена!");
          await logActivity(
            "Редактирование поста",
            `Изменен пост #${editingPostId}: "${postContent.substring(0, 40)}..."`,
          );
          resetForm();
        }
      } else {
        const { data, error } = await supabase
          .from("posts")
          .insert([
            {
              content: postContent.trim(),
              media_url: mediaUrl.trim() || null,
              media_type: determinedMediaType,
            },
          ])
          .select();

        if (error) {
          showNotification("error", error.message);
        } else if (data && data.length > 0) {
          setPosts((prev) => [data[0], ...prev]);
          showNotification("success", "Публикация создана!");
          await logActivity(
            "Создание публикации",
            `Опубликован пост #${data[0].id}: "${postContent.substring(0, 40)}..."`,
          );
          resetForm();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingPostId(null);
    setPostContent("");
    setMediaUrl("");
    setMediaType("none");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm("Удалить этот пост?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      showNotification("success", "Пост удален!");
      await logActivity("Удаление публикации", `Удален пост #${id} из ленты`);
    }
  };

  const startEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setPostContent(post.content);
    setMediaUrl(post.media_url || "");
    setMediaType(post.media_type || "none");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: string,
    targetEmail: string,
  ) => {
    const nextStatus = currentStatus === "banned" ? "active" : "banned";

    const { error } = await supabase
      .from("profiles")
      .update({ status: nextStatus })
      .eq("id", userId);

    if (!error) {
      setProfiles((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u)),
      );
      showNotification("success", `Статус изменен на "${nextStatus}"`);
      await logActivity(
        nextStatus === "banned"
          ? "Блокировка аккаунта"
          : "Разблокировка аккаунта",
        nextStatus === "banned"
          ? `Заблокирован доступ для ${targetEmail}`
          : `Разблокирован доступ для ${targetEmail}`,
      );
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Полностью очистить журнал действий?")) return;
    const { error } = await supabase
      .from("activity_logs")
      .delete()
      .neq("id", 0);
    if (!error) {
      setLogs([]);
      showNotification("success", "Журнал очищен!");
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.user_email.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(logSearch.toLowerCase())),
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white dark:bg-black text-black dark:text-white">
        <div className="w-full max-w-sm bg-gray-50 dark:bg-[#111] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Вход в панель управления</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Доступ только для администратора
            </p>
          </div>
          {authError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs text-red-600 dark:text-red-400 text-left flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}
          <button
            onClick={handleAdminGoogleLogin}
            className="w-full flex items-center justify-center gap-2 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs hover:opacity-90 transition active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Войти через Google
          </button>
          <div>
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-black dark:hover:text-white transition flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col relative select-none">
      {notification && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[90%] p-4 rounded-2xl border shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <p className="text-xs font-semibold leading-tight">
            {notification.message}
          </p>
        </div>
      )}

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-gray-100 dark:border-gray-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeTab === "menu" ? (
            <Link
              href="/profile"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : (
            <button
              onClick={() => {
                setActiveTab("menu");
                resetForm();
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-bold">
            {activeTab === "menu" && "Панель администратора"}
            {activeTab === "posts" && "Управление постами"}
            {activeTab === "users" && "Пользователи"}
            {activeTab === "logs" && "Журнал действий"}
          </h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-lg w-full mx-auto space-y-6">
        {activeTab === "menu" && (
          <div className="grid grid-cols-1 gap-4 pt-2">
            {/* 🔴 YANGI: LIVE RADAR TUGMASI */}
            <Link
              href="/admin/radar"
              className="flex items-start gap-4 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#0a1a15] dark:to-[#05110d] border border-emerald-200/50 dark:border-emerald-900/50 rounded-3xl text-left hover:border-emerald-500/50 transition group active:scale-[0.99] cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

              <div className="relative p-3.5 bg-emerald-500 text-white rounded-2xl group-hover:scale-105 transition shadow-lg shadow-emerald-500/20">
                <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping opacity-75" />
                <Activity className="w-6 h-6 relative z-10" />
              </div>
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-base text-emerald-800 dark:text-emerald-400">
                    Live Radar
                  </h2>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-500/70 leading-relaxed font-medium">
                  Следите за активностью пользователей на сайте в реальном
                  времени.
                </p>
              </div>
            </Link>

            <button
              onClick={() => setActiveTab("posts")}
              className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-3xl text-left hover:border-blue-500/50 transition group active:scale-[0.99] cursor-pointer"
            >
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-105 transition">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-base mb-1">Управление постами</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Создание публикаций, загрузка медиафайлов и видео.
                </p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-3xl text-left hover:border-purple-500/50 transition group active:scale-[0.99] cursor-pointer"
            >
              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-105 transition">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-base mb-1">Пользователи</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Список зарегистрированных пользователей и модерация.
                </p>
              </div>
            </button>

            <Link
              href="/"
              className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-3xl text-left hover:border-emerald-500/50 transition group active:scale-[0.99]"
            >
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-105 transition">
                <Eye className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-base mb-1">
                  Режим админа на сайте
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Просмотр ленты с расширенными правами администратора.
                </p>
              </div>
            </Link>

            <button
              onClick={() => setActiveTab("logs")}
              className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-3xl text-left hover:border-amber-500/50 transition group active:scale-[0.99] cursor-pointer"
            >
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-105 transition">
                <History className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-base mb-1">Журнал действий</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Логи действий пользователей, авторизаций и модерации.
                </p>
              </div>
            </button>
          </div>
        )}

        {activeTab === "posts" && (
          <div className="space-y-6">
            <form
              onSubmit={handleSavePost}
              className="p-5 bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-3xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-500" />
                  {editingPostId
                    ? "Редактировать публикацию"
                    : "Новая публикация"}
                </h2>
                {editingPostId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Отмена
                  </button>
                )}
              </div>

              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Что нового?..."
                className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl p-3.5 text-sm min-h-[110px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {mediaUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black/5 dark:bg-white/5 p-2">
                  {mediaType === "video" ||
                  mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                    <video
                      src={mediaUrl}
                      controls
                      className="max-h-48 w-full rounded-xl object-contain"
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Preview"
                      className="max-h-48 w-full rounded-xl object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaUrl("");
                      setMediaType("none");
                    }}
                    className="absolute top-3 right-3 p-1.5 bg-black/70 text-white rounded-full hover:bg-black transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold hover:border-blue-500 transition disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    <span>
                      {uploadingFile ? uploadProgressText : "Прикрепить файл"}
                    </span>
                  </button>
                </div>

                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => {
                    setMediaUrl(e.target.value);
                    if (e.target.value.match(/\.(mp4|webm|mov)$/i)) {
                      setMediaType("video");
                    } else if (e.target.value) {
                      setMediaType("image");
                    }
                  }}
                  placeholder="Или ссылка на фото/видео..."
                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  uploadingFile ||
                  (!postContent.trim() && !mediaUrl.trim())
                }
                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl text-sm hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingPostId ? (
                  "Обновить"
                ) : (
                  "Опубликовать"
                )}
              </button>
            </form>

            <div className="space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                Все публикации ({posts.length})
              </h2>

              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-2xl flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    {post.content && (
                      <p className="text-xs text-gray-900 dark:text-gray-100 line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditPost(post)}
                      className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
              Зарегистрированные пользователи ({profiles.length})
            </h2>

            {profiles.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800">
                Пользователи пока не зарегистрированы
              </div>
            ) : (
              profiles.map((user) => (
                <Link
                  href={`/profile/${encodeURIComponent(user.email)}`}
                  key={user.id}
                  className="p-4 bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-between gap-3 hover:border-blue-500/50 transition group cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate group-hover:text-blue-500 transition flex items-center gap-1.5">
                      {user.email}
                      <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                    </p>
                    <span
                      className={`text-[10px] inline-flex items-center gap-1 mt-0.5 ${
                        user.status === "banned"
                          ? "text-red-500 font-semibold"
                          : "text-emerald-500"
                      }`}
                    >
                      {user.status === "banned" ? "Заблокирован" : "Активен"}
                    </span>
                  </div>

                  {user.email !== ADMIN_EMAIL && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleUserStatus(
                          user.id,
                          user.status,
                          user.email,
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        user.status === "banned"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50"
                      }`}
                    >
                      {user.status === "banned"
                        ? "Разблокировать"
                        : "Заблокировать"}
                    </button>
                  )}
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Журнал действий ({filteredLogs.length})
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  История действий, модерации и входов на сайт
                </p>
              </div>

              {logs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1.5 font-bold px-3 py-1.5 bg-red-50 dark:bg-red-950/30 rounded-xl transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Очистить
                </button>
              )}
            </div>

            {/* Qidiruv inputi */}
            {logs.length > 0 && (
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-3.5 text-gray-400" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Поиск по email или действию..."
                  className="w-full pl-9 pr-3.5 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800">
                {logs.length === 0
                  ? "Журнал действий пока пуст"
                  : "Ничего не найдено"}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const meta = getLogMeta(log.action);
                  const cleanedDetails = cleanLogDetails(log.details);

                  return (
                    <div
                      key={log.id}
                      className="p-4 bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-gray-800/80 rounded-2xl flex flex-col gap-2.5 transition hover:border-gray-300 dark:hover:border-gray-700 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-2 rounded-xl bg-white dark:bg-black/60 border border-gray-200/60 dark:border-gray-800 shrink-0">
                            {meta.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                {log.action}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${meta.bg}`}
                              >
                                {meta.badge}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400 block mt-0.5 truncate">
                              Пользователь:{" "}
                              <span className="font-medium text-gray-600 dark:text-gray-300">
                                {log.user_email}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(log.created_at).toLocaleDateString(
                              "ru-RU",
                              {
                                day: "2-digit",
                                month: "2-digit",
                              },
                            )}{" "}
                            {new Date(log.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {cleanedDetails && (
                        <div className="bg-white dark:bg-black/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/60 text-xs text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                          {cleanedDetails}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
