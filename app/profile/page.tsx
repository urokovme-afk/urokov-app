/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  LogOut,
  Mail,
  User as UserIcon,
  Shield,
  Check,
  Save,
  Camera,
  Trash2,
  Phone,
  AtSign,
  Heart,
  MessageSquare,
  Activity,
  X,
  ExternalLink,
  Plus,
  Eye,
  Sparkles,
  Edit3,
  Loader2,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { ChatHub } from "../../components/chat-hub";

const ADMIN_EMAIL = "urokov.me@gmail.com";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as Record<string, unknown>).message);
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};

interface ProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  birth_date?: string | null;
  [key: string]: unknown;
}

interface LikedItem {
  id: number;
  post_id: number;
  created_at?: string;
  post_content?: string;
}

interface CommentedItem {
  id: string | number;
  post_id: number;
  content: string;
  created_at: string;
  post_content?: string;
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
  id: number;
  story_id: number;
  viewer_email: string;
  viewed_at: string;
}

interface ProfileViewItem {
  id: number;
  profile_email: string;
  viewer_email: string;
  viewed_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [birthDate, setBirthDate] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState("active");

  const [usernameError, setUsernameError] = useState("");
  const [isZoomed, setIsZoomed] = useState(false);

  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});

  const [likedPosts, setLikedPosts] = useState<LikedItem[]>([]);
  const [userComments, setUserComments] = useState<CommentedItem[]>([]);
  const [activeModal, setActiveModal] = useState<"likes" | "comments" | null>(
    null,
  );

  const [profileViews, setProfileViews] = useState<ProfileViewItem[]>([]);
  const [showProfileViewsModal, setShowProfileViewsModal] = useState(false);

  const [myStories, setMyStories] = useState<Story[]>([]);
  const [storyViews, setStoryViews] = useState<StoryView[]>([]);
  const [showStoryJournal, setShowStoryJournal] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(
    null,
  );
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDuration, setVideoDuration] = useState(5);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const storyFileInputRef = useRef<HTMLInputElement | null>(null);

  const currentEmail = session?.user?.email?.toLowerCase().trim() || "";
  const isAdmin = currentEmail === ADMIN_EMAIL.toLowerCase().trim();

  // Oxirgi 48 soat ichida admin profilini ko'rganlarni yuklash (Xatolikni aniq chiqarish uchun moslashtirildi)
  const fetchAdminProfileViews = async () => {
    if (!isAdmin) return;
    const fortyEightHoursAgo = new Date(
      Date.now() - 48 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from("profile_views")
      .select("*")
      .eq("profile_email", ADMIN_EMAIL.toLowerCase().trim())
      .gte("viewed_at", fortyEightHoursAgo)
      .order("viewed_at", { ascending: false });

    if (error) {
      // 🔴 Supabase xatosining barcha xususiyatlarini aniq ko'rsatamiz
      console.error("Supabase Profile Views Error Code:", error.code);
      console.error("Supabase Profile Views Error Message:", error.message);
      console.error("Supabase Profile Views Error Hint:", error.hint);

      alert(
        `Xatolik: ${error.message} \nMaslahat (Hint): ${error.hint || "Yo'q"}`,
      );
      return;
    }

    if (data) {
      setProfileViews(data);
      setShowProfileViewsModal(true);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadProfileData = async () => {
      const {
        data: { session: curSession },
      } = await supabase.auth.getSession();
      if (!curSession) {
        router.push("/login");
        return;
      }
      if (!isMounted) return;
      setSession(curSession);
      const userEmail = curSession.user.email?.toLowerCase().trim() || "";
      const userId = curSession.user.id;
      const isAdminUser = userEmail === ADMIN_EMAIL.toLowerCase().trim();

      // 1) O'z profil qatorini olish (kerak bo'lsa yaratish)
      let { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .ilike("email", userEmail)
        .maybeSingle();

      if (!profile) {
        await supabase.from("profiles").insert([
          {
            id: userId,
            email: userEmail,
            full_name: curSession.user.user_metadata?.full_name || "",
            avatar_url: curSession.user.user_metadata?.avatar_url || "",
          },
        ]);
        const { data: newProf } = await supabase
          .from("profiles")
          .select("*")
          .ilike("email", userEmail)
          .maybeSingle();
        profile = newProf;
      }

      if (profile && isMounted) {
        setFullName(profile.full_name || "");
        setUsername(profile.username || "");
        setOriginalUsername(profile.username || "");
        setPhone(profile.phone ? profile.phone : "+998 ");
        setBirthDate(profile.birth_date || "");
        setBio(profile.bio || "");
        setAvatarUrl(
          profile.avatar_url || curSession.user.user_metadata?.avatar_url || "",
        );
        setStatus(profile.status || "active");
      } else if (isMounted) {
        setFullName(curSession.user.user_metadata?.full_name || "");
        setBio(curSession.user.user_metadata?.bio || "");
        setAvatarUrl(curSession.user.user_metadata?.avatar_url || "");
      }

      // ⚡ 2) Qolgan HAMMA so'rovni PARALLEL qilamiz,
      //     va reactions/comments'ni ENDI SERVERDA filtrlaymiz (butun jadval emas!)
      const orFilter = `user_email.eq.${userEmail},user_id.eq.${userId}`;
      const [
        { data: allProfs },
        { data: sts },
        { data: allPosts },
        { data: rawReactions },
        { data: rawComments },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("email, full_name, username, avatar_url"),
        isAdminUser
          ? supabase
              .from("stories")
              .select("*")
              .ilike("user_email", userEmail)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as Story[] }),
        supabase.from("posts").select("id, content"),
        supabase.from("reactions").select("*").or(orFilter),
        supabase
          .from("comments")
          .select("*")
          .or(orFilter)
          .order("created_at", { ascending: false }),
      ]);

      if (!isMounted) return;

      if (allProfs) {
        const map: Record<string, ProfileData> = {};
        allProfs.forEach((p: ProfileData & { email?: string }) => {
          if (p.email) map[p.email.toLowerCase().trim()] = p;
        });
        setProfiles(map);
      }

      if (isAdminUser) {
        setMyStories(sts || []);
        const storyIds = (sts || []).map((s) => s.id);
        if (storyIds.length > 0) {
          // ⚡ Endi faqat O'Z storylaringizga tegishli view'larni olamiz
          const { data: stViews } = await supabase
            .from("story_views")
            .select("*")
            .in("story_id", storyIds);
          if (isMounted && stViews) setStoryViews(stViews);
        } else {
          setStoryViews([]);
        }
      } else {
        setMyStories([]);
        setStoryViews([]);
      }

      const postMap: Record<number, string> = {};
      allPosts?.forEach((p: { id: number; content?: string }) => {
        postMap[p.id] = p.content?.trim() || "Медиа публикация";
      });

      if (rawReactions) {
        setLikedPosts(
          rawReactions.map((r: Record<string, unknown>) => ({
            id: Number(r.id),
            post_id: Number(r.post_id),
            created_at: String(r.created_at || ""),
            post_content:
              postMap[Number(r.post_id)] || "Публикация #" + r.post_id,
          })),
        );
      } else {
        setLikedPosts([]);
      }

      if (rawComments) {
        setUserComments(
          rawComments.map((c: Record<string, unknown>) => ({
            id: c.id as string | number,
            post_id: Number(c.post_id),
            content: String(c.content || ""),
            created_at: String(c.created_at || ""),
            post_content:
              postMap[Number(c.post_id)] || "Публикация #" + c.post_id,
          })),
        );
      } else {
        setUserComments([]);
      }

      if (isMounted) setLoading(false);
    };

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [router]);

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

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `${Date.now()}_story_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `user_stories/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from("stories")
        .upload(filePath, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from("stories")
        .getPublicUrl(filePath);

      const isVideo = file.type.startsWith("video/");
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + 1);

      const { data: stData, error: dbErr } = await supabase
        .from("stories")
        .insert([
          {
            user_email: session.user.email.toLowerCase().trim(),
            media_url: urlData.publicUrl,
            media_type: isVideo ? "video" : "image",
            duration_days: 1,
            expires_at: expiresDate.toISOString(),
          },
        ])
        .select();

      if (dbErr) throw dbErr;

      if (stData && stData.length > 0) {
        setMyStories((prev) => [stData[0] as Story, ...prev]);
      }
    } catch (err: unknown) {
      alert("Ошибка при загрузке истории: " + getErrorMessage(err));
    } finally {
      if (storyFileInputRef.current) storyFileInputRef.current.value = "";
    }
  };

  const handleDeleteStory = async (storyId: number) => {
    if (!isAdmin) return;
    if (!confirm("Удалить эту историю?")) return;

    const storyToDelete = myStories.find((s) => s.id === storyId);
    if (storyToDelete?.media_url) {
      try {
        const urlParts = storyToDelete.media_url.split(
          "/storage/v1/object/public/stories/",
        );
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split("?")[0];
          if (filePath) {
            await supabase.storage.from("stories").remove([filePath]);
          }
        }
      } catch (storageErr) {
        console.error("Storage faylini o'chirishda xatolik:", storageErr);
      }
    }

    setMyStories((prev) => prev.filter((s) => s.id !== storyId));
    await supabase.from("stories").delete().eq("id", storyId);
    setViewingStoryIndex(null);
  };

  const handleUpdateStoryCaption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingStory) return;

    try {
      const { error } = await supabase
        .from("stories")
        .update({ caption: editCaption.trim() || null })
        .eq("id", editingStory.id);

      if (error) throw error;

      setMyStories((prev) =>
        prev.map((s) =>
          s.id === editingStory.id ? { ...s, caption: editCaption.trim() } : s,
        ),
      );
      setEditingStory(null);
      setEditCaption("");
    } catch (err: unknown) {
      alert("Ошибка при обновлении: " + getErrorMessage(err));
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      if (isStoryPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isStoryPaused]);

  useEffect(() => {
    if (!isAdmin) return;
    if (viewingStoryIndex === null || isStoryPaused || myStories.length === 0)
      return;

    const currentSt = myStories[viewingStoryIndex];
    if (!currentSt) return;

    const isVideo = currentSt.media_type === "video";
    const totalDurationMs = isVideo ? videoDuration * 1000 : 5000;
    const interval = 50;
    const step = 100 / (totalDurationMs / interval);

    const timer = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          if (viewingStoryIndex < myStories.length - 1) {
            setViewingStoryIndex((i) => (i !== null ? i + 1 : null));
            setStoryProgress(0);
            return 0;
          } else {
            setViewingStoryIndex(null);
            setStoryProgress(0);
            return 0;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [viewingStoryIndex, isStoryPaused, myStories, videoDuration, isAdmin]);

  const handlePhoneChange = (val: string) => {
    if (!val.startsWith("+998")) {
      setPhone("+998 ");
      return;
    }
    const digitsOnly = val.slice(4).replace(/\D/g, "");
    const limitedDigits = digitsOnly.slice(0, 9);
    setPhone("+998 " + limitedDigits);
  };

  const handleUsernameChange = async (val: string) => {
    const cleaned = val
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    setUsername(cleaned);
    setUsernameError("");

    if (!cleaned) return;
    if (originalUsername && cleaned === originalUsername.toLowerCase().trim())
      return;

    if (cleaned.length < 3) {
      setUsernameError("Минимум 3 символа");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("email, username")
      .ilike("username", cleaned);

    if (data && data.length > 0) {
      const currentEmail = session?.user.email?.toLowerCase().trim() || "";
      const isTaken = data.some(
        (p: ProfileData & { email?: string }) =>
          p.username?.toLowerCase().trim() === cleaned &&
          p.email?.toLowerCase().trim() !== currentEmail,
      );
      if (isTaken) {
        setUsernameError("Это имя пользователя уже занято");
      }
    }
  };

  const deleteOldAvatar = async (url: string) => {
    if (!url || !url.includes("/storage/v1/object/public/media/")) return;
    try {
      const oldPath = url
        .split("/storage/v1/object/public/media/")[1]
        ?.split("?")[0];
      if (oldPath) {
        await supabase.storage.from("media").remove([oldPath]);
      }
    } catch (err) {
      console.error("Ошибка удаления старого аватара:", err);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user.email) return;

    setUploadingAvatar(true);

    try {
      if (avatarUrl) {
        await deleteOldAvatar(avatarUrl);
      }

      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `avatar_${session.user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("media").getPublicUrl(filePath);
      const newUrl = data.publicUrl;
      setAvatarUrl(newUrl);

      await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("id", session.user.id);
      await supabase.auth.updateUser({ data: { avatar_url: newUrl } });
    } catch (err: unknown) {
      alert("Ошибка: " + getErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl || !confirm("Удалить фото профиля?")) return;

    await deleteOldAvatar(avatarUrl);
    setAvatarUrl("");
    if (session?.user.id) {
      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", session.user.id);
      await supabase.auth.updateUser({ data: { avatar_url: "" } });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetUsername = username.trim().toLowerCase();
    const currentEmail = session?.user.email?.toLowerCase().trim() || "";
    const userId = session?.user.id;

    if (
      targetUsername &&
      targetUsername !== originalUsername.toLowerCase().trim()
    ) {
      const { data } = await supabase
        .from("profiles")
        .select("email, username")
        .ilike("username", targetUsername);
      const isTaken = data?.some(
        (p: ProfileData & { email?: string }) =>
          p.username?.toLowerCase().trim() === targetUsername &&
          p.email?.toLowerCase().trim() !== currentEmail,
      );

      if (isTaken) {
        setUsernameError("Это имя пользователя уже занято");
        return;
      }
    }

    if (usernameError) return;

    setSaving(true);
    setSavedSuccess(false);

    try {
      const cleanPhone = phone.trim() === "+998" ? null : phone.trim();

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          email: currentEmail,
          full_name: fullName.trim(),
          username: targetUsername || null,
          phone: cleanPhone,
          birth_date: birthDate || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl || null,
        },
        { onConflict: "id" },
      );

      if (profileError) throw profileError;

      await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
        },
      });

      setOriginalUsername(targetUsername);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      alert("Ошибка при сохранении: " + getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-black text-black dark:text-white select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#111] p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col relative my-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition text-gray-500 hover:text-black dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-1.5">
            {isAdmin ? (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Shield className="w-3.5 h-3.5" />
                Администратор
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                <UserIcon className="w-3.5 h-3.5" />
                Участник
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative group mb-3">
            {isAdmin && (
              <input
                type="file"
                ref={storyFileInputRef}
                onChange={handleSelectStoryFile}
                accept="image/*,video/*"
                className="hidden"
              />
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />

            <div
              onClick={() => {
                if (isAdmin) {
                  if (myStories.length > 0) {
                    setViewingStoryIndex(0);
                    setStoryProgress(0);
                  } else {
                    storyFileInputRef.current?.click();
                  }
                } else if (avatarUrl) {
                  setIsZoomed(true);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className={`relative w-24 h-24 rounded-full p-0.5 cursor-pointer transition active:scale-95 ${
                isAdmin && myStories.length > 0
                  ? "bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg animate-pulse"
                  : "border-2 border-gray-200 dark:border-gray-800"
              }`}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover bg-gray-100 dark:bg-[#1a1a1a]"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center text-gray-400">
                  <UserIcon className="w-10 h-10" />
                </div>
              )}
            </div>

            {isAdmin ? (
              <button
                type="button"
                onClick={() => storyFileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition active:scale-95 z-10"
                title="Добавить историю"
              >
                <Plus className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition active:scale-95 z-10 disabled:opacity-70"
                title="Изменить фото"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            )}

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute top-0 right-0 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition active:scale-95 z-10"
                title="Удалить фото"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
            <Mail className="w-3.5 h-3.5" />
            {session.user.email}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 p-3 bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-gray-800/80 rounded-2xl mb-4 text-center">
          <button
            type="button"
            onClick={() => setActiveModal("likes")}
            className="hover:bg-white dark:hover:bg-black/40 p-1.5 rounded-xl transition active:scale-95 flex flex-col items-center cursor-pointer"
          >
            <div className="flex items-center justify-center gap-1 text-gray-400 text-[11px] mb-0.5">
              <Heart className="w-3 h-3 text-red-500" />
              <span>Лайки</span>
            </div>
            <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
              {likedPosts.length}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("comments")}
            className="hover:bg-white dark:hover:bg-black/40 p-1.5 rounded-xl transition active:scale-95 border-x border-gray-200 dark:border-gray-800 flex flex-col items-center cursor-pointer"
          >
            <div className="flex items-center justify-center gap-1 text-gray-400 text-[11px] mb-0.5">
              <MessageSquare className="w-3 h-3 text-blue-500" />
              <span>Коммент.</span>
            </div>
            <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
              {userComments.length}
            </p>
          </button>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => setShowStoryJournal(true)}
              className="hover:bg-white dark:hover:bg-black/40 p-1.5 rounded-xl transition active:scale-95 flex flex-col items-center cursor-pointer"
            >
              <div className="flex items-center justify-center gap-1 text-gray-400 text-[11px] mb-0.5">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>Истории</span>
              </div>
              <p className="font-bold text-xs text-blue-500 truncate max-w-[85px]">
                {myStories.length} актив.
              </p>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center p-1.5">
              <div className="flex items-center justify-center gap-1 text-gray-400 text-[11px] mb-0.5">
                <Activity className="w-3 h-3 text-emerald-500" />
                <span>Статус</span>
              </div>
              <p
                className={`font-bold text-xs ${
                  status === "banned" ? "text-red-500" : "text-emerald-500"
                }`}
              >
                {status === "banned" ? "Бан" : "Активен"}
              </p>
            </div>
          )}
        </div>

        {/* 🔴 FAQAT ADMIN UCHUN: PROFILGA TASHRIF BUYURGANLARNI KO'RISH TUGMASI (To'g'rilandi) */}
        {isAdmin && (
          <button
            type="button"
            onClick={fetchAdminProfileViews}
            className="w-full mb-6 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition active:scale-95 shadow-sm cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Кто смотрел мой профиль (48 ч.)
          </button>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">
              Отображаемое имя
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-black dark:text-white"
              placeholder="Ваше имя"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="text-xs font-semibold text-gray-500">
                Имя пользователя (username)
              </label>
              <span className="text-[10px] text-gray-400">Необязательно</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-gray-400">
                <AtSign className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`w-full bg-gray-50 dark:bg-[#161616] border ${
                  usernameError
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-800"
                } rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-black dark:text-white`}
                placeholder="username"
              />
            </div>
            {usernameError && (
              <p className="text-[11px] text-red-500 mt-1 ml-1 font-medium">
                {usernameError}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="text-xs font-semibold text-gray-500">
                Номер телефона
              </label>
              <span className="text-[10px] text-gray-400">Необязательно</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-gray-400">
                <Phone className="w-3.5 h-3.5" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-black dark:text-white font-mono"
                placeholder="+998 90 123 45 67"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="text-xs font-semibold text-gray-500">
                Дата рождения
              </label>
              <span className="text-[10px] text-gray-400">Необязательно</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-gray-400">
                <CalendarDays className="w-3.5 h-3.5" />
              </span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-black dark:text-white cursor-pointer"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="text-xs font-semibold text-gray-500">
                О себе (Bio)
              </label>
              <span className="text-[10px] text-gray-400">Необязательно</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition text-black dark:text-white resize-none"
              placeholder="Пара слов о себе..."
            />
          </div>

          <button
            type="submit"
            disabled={saving || Boolean(usernameError)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl hover:opacity-90 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                Сохранено!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saving ? "Сохранение..." : "Сохранить изменения"}
              </>
            )}
          </button>
        </form>

        {isAdmin && (
          <Link
            href="/admin"
            className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition active:scale-95 border border-blue-200 dark:border-blue-900/50"
          >
            <Shield className="w-4 h-4" />
            Панель управления (Admin)
          </Link>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-950/30 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition active:scale-95 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Выйти из аккаунта
        </button>
      </div>

      {/* 🔴 OXIRGI 48 SOATDA PROFILNI KO'RGANLAR MODALI (FAQAT ADMIN) */}
      {isAdmin && showProfileViewsModal && (
        <div
          onClick={() => setShowProfileViewsModal(false)}
          className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-xs">
                  Просмотры профиля за 48 часов ({profileViews.length})
                </span>
              </div>
              <button
                onClick={() => setShowProfileViewsModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {profileViews.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  Никто не заходил за последние 48 часов
                </p>
              ) : (
                profileViews.map((view) => {
                  const viewerProf =
                    profiles[view.viewer_email.toLowerCase().trim()];
                  const vName = viewerProf?.username
                    ? `@${viewerProf.username}`
                    : viewerProf?.full_name || view.viewer_email.split("@")[0];

                  return (
                    <Link
                      key={view.id}
                      href={`/profile/${encodeURIComponent(view.viewer_email)}`}
                      onClick={() => setShowProfileViewsModal(false)}
                      className="p-3 bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-between hover:border-purple-500/40 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={
                            viewerProf?.avatar_url || "/avatar-placeholder.png"
                          }
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-purple-500 transition">
                            {vName}
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono block">
                            {new Date(view.viewed_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded-lg">
                        Визит
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {isAdmin && showStoryJournal && (
        <div
          onClick={() => setShowStoryJournal(false)}
          className="fixed inset-0 z-[115] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <span className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Журнал историй ({myStories.length})
              </span>
              <button
                onClick={() => setShowStoryJournal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {myStories.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  У вас нет загруженных историй
                </p>
              ) : (
                myStories.map((st, idx) => {
                  const viewsCount = storyViews.filter(
                    (v) => v.story_id === st.id,
                  ).length;
                  const isExpired = st.expires_at <= new Date().toISOString();
                  const expiresText = new Date(
                    st.expires_at,
                  ).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={st.id}
                      className={`p-3 border rounded-2xl flex items-center justify-between gap-3 ${isExpired ? "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30 opacity-70" : "bg-gray-50 dark:bg-[#161616] border-gray-100 dark:border-gray-800"}`}
                    >
                      <div
                        onClick={() => {
                          setShowStoryJournal(false);
                          setViewingStoryIndex(idx);
                          setStoryProgress(0);
                        }}
                        className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 cursor-pointer relative group border border-gray-200 dark:border-gray-700"
                      >
                        {st.media_type === "video" ? (
                          <video
                            src={st.media_url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={st.media_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate flex items-center gap-2">
                          {st.caption || "Без подписи"}
                          {isExpired && (
                            <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-[9px] rounded uppercase font-bold">
                              Архив
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 font-mono">
                          <span>До: {expiresText}</span>
                          <span className="flex items-center gap-1 text-blue-500 font-bold">
                            <Eye className="w-3.5 h-3.5" /> {viewsCount}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingStory(st);
                            setEditCaption(st.caption || "");
                          }}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-500 hover:text-blue-500 rounded-xl transition cursor-pointer"
                          title="Редактировать"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStory(st.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-500 hover:text-red-500 rounded-xl transition cursor-pointer"
                          title="Удалить навсегда"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {isAdmin && editingStory && (
        <div
          onClick={() => setEditingStory(null)}
          className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <form
            onSubmit={handleUpdateStoryCaption}
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm w-full bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <span className="font-bold text-xs">Редактировать подпись</span>
              <button
                type="button"
                onClick={() => setEditingStory(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="Новая подпись к истории..."
              className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-black dark:text-white"
            />

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer"
            >
              Сохранить
            </button>
          </form>
        </div>
      )}

      {isAdmin &&
        viewingStoryIndex !== null &&
        myStories[viewingStoryIndex] && (
          <div
            className="fixed inset-0 z-[120] bg-black flex items-center justify-center select-none animate-in fade-in duration-200"
            onMouseDown={() => setIsStoryPaused(true)}
            onMouseUp={() => setIsStoryPaused(false)}
            onTouchStart={() => setIsStoryPaused(true)}
            onTouchEnd={() => setIsStoryPaused(false)}
          >
            <div className="relative w-full max-w-md h-full sm:h-[92vh] sm:rounded-3xl overflow-hidden bg-[#0a0a0a] flex flex-col justify-between shadow-2xl border border-white/10">
              <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
                {myStories.map((s, idx) => {
                  const isPassed = idx < viewingStoryIndex;
                  const isCurrent = idx === viewingStoryIndex;
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
                  <img
                    src={avatarUrl || "/avatar-placeholder.png"}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-white/40"
                  />
                  <div className="leading-tight text-left">
                    <p className="text-xs font-bold">
                      {fullName || "Моя история"}
                    </p>
                    <p className="text-[10px] text-white/70 flex items-center gap-1">
                      {new Date(
                        myStories[viewingStoryIndex].created_at,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {myStories[viewingStoryIndex].expires_at <=
                        new Date().toISOString() && (
                        <span className="text-red-400 font-bold">
                          (В архиве)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStory(myStories[viewingStoryIndex].id);
                    }}
                    className="p-1.5 rounded-full bg-black/50 hover:bg-red-500 transition text-white cursor-pointer"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingStoryIndex(null);
                    }}
                    className="p-1.5 rounded-full bg-black/50 hover:bg-white/20 transition text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
                {myStories[viewingStoryIndex].media_type === "video" ? (
                  <video
                    ref={videoRef}
                    src={myStories[viewingStoryIndex].media_url}
                    autoPlay
                    playsInline
                    muted={false}
                    onLoadedMetadata={(e) => {
                      setVideoDuration(e.currentTarget.duration || 5);
                    }}
                    className="w-full h-full object-contain"
                    onEnded={() => {
                      if (viewingStoryIndex < myStories.length - 1) {
                        setViewingStoryIndex((i) =>
                          i !== null ? i + 1 : null,
                        );
                        setStoryProgress(0);
                      } else {
                        setViewingStoryIndex(null);
                        setStoryProgress(0);
                      }
                    }}
                  />
                ) : (
                  <img
                    src={myStories[viewingStoryIndex].media_url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                )}

                <div
                  className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (viewingStoryIndex > 0) {
                      setViewingStoryIndex((i) => (i !== null ? i - 1 : null));
                      setStoryProgress(0);
                    }
                  }}
                />
                <div
                  className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (viewingStoryIndex < myStories.length - 1) {
                      setViewingStoryIndex((i) => (i !== null ? i + 1 : null));
                      setStoryProgress(0);
                    } else {
                      setViewingStoryIndex(null);
                      setStoryProgress(0);
                    }
                  }}
                />
              </div>

              {myStories[viewingStoryIndex].caption && (
                <div className="absolute bottom-4 inset-x-4 z-30 p-3 bg-black/60 backdrop-blur-md rounded-2xl text-white text-xs leading-relaxed text-center">
                  {myStories[viewingStoryIndex].caption}
                </div>
              )}
            </div>
          </div>
        )}

      {isZoomed && avatarUrl && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div className="relative max-w-lg w-full flex items-center justify-center">
            <img
              src={avatarUrl}
              alt="Zoomed Avatar"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-gray-800"
            />
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {activeModal && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                {activeModal === "likes" ? (
                  <>
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-xs">
                      Понравившиеся публикации
                    </span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-xs">Ваши комментарии</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {activeModal === "likes" ? (
                likedPosts.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">
                    Вы еще не поставили ни одного лайка
                  </p>
                ) : (
                  likedPosts.map((item) => (
                    <Link
                      key={item.id}
                      href="/"
                      onClick={() => setActiveModal(null)}
                      className="p-3 bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-between hover:border-blue-500/40 transition group"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs text-gray-800 dark:text-gray-200 truncate font-medium">
                          {item.post_content}
                        </p>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ID публикации: #{item.post_id}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 shrink-0" />
                    </Link>
                  ))
                )
              ) : userComments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  Вы еще не оставили ни одного комментария
                </p>
              ) : (
                userComments.map((item) => (
                  <Link
                    key={item.id}
                    href="/"
                    onClick={() => setActiveModal(null)}
                    className="p-3 bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-between hover:border-blue-500/40 transition group"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs text-gray-900 dark:text-gray-100 font-semibold truncate">
                        &quot;{item.content}&quot;
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        К посту: {item.post_content}
                      </p>
                      <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                        {new Date(item.created_at).toLocaleDateString()}{" "}
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <ChatHub
        session={session}
        isBanned={status === "banned"}
        profiles={profiles}
      />
    </div>
  );
}
