/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, useParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  User as UserIcon,
  Shield,
  AtSign,
  Activity,
  X,
  Eye,
  Loader2,
  Heart,
  MessageCircle,
  Bell,
  BellOff,
  Ban,
  Phone,
  CalendarDays,
  ExternalLink,
  Mail,
  MessageSquare,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { ChatHub } from "../../../components/chat-hub";

const ADMIN_EMAIL = "urokov.me@gmail.com";

const getTempId = () => Math.floor(Math.random() * 100000000);
const getNowIso = () => new Date().toISOString();

// --- TYPES & INTERFACES ---
interface ProfileData {
  id?: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  status?: string;
  bio?: string;
  phone?: string;
  birth_date?: string;
  [key: string]: unknown;
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

interface StoryLike {
  id: number;
  story_id: number;
  user_email: string;
  created_at: string;
}

interface LikedItem {
  id: number;
  post_id: number;
  created_at: string;
  post_content?: string;
}

interface CommentedItem {
  id: string | number;
  post_id: number;
  content: string;
  created_at: string;
  post_content?: string;
}

interface ProfileViewItem {
  id: number;
  profile_email: string;
  viewer_email: string;
  viewed_at: string;
}

export default function UserPublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const rawParam = params?.email;
  const profileEmail = rawParam
    ? decodeURIComponent(String(rawParam)).toLowerCase().trim()
    : "";

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [isCurrentUserBanned, setIsCurrentUserBanned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [amIBlocking, setAmIBlocking] = useState(false);
  const [spyTargetEmail, setSpyTargetEmail] = useState<string | undefined>(
    undefined,
  );

  const [userStories, setUserStories] = useState<Story[]>([]);
  const [storyViews, setStoryViews] = useState<StoryView[]>([]);
  const [storyLikes, setStoryLikes] = useState<StoryLike[]>([]);

  const [likedPosts, setLikedPosts] = useState<LikedItem[]>([]);
  const [userComments, setUserComments] = useState<CommentedItem[]>([]);
  const [activeModal, setActiveModal] = useState<"likes" | "comments" | null>(
    null,
  );

  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(
    null,
  );
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState(5);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const viewedSessionTracker = useRef<Set<string>>(new Set());
  const [isZoomed, setIsZoomed] = useState(false);

  const [profileViews, setProfileViews] = useState<ProfileViewItem[]>([]);
  const [showProfileViewsModal, setShowProfileViewsModal] = useState(false);

  // Faoliyat loglarini yozish
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

  const currentEmail = session?.user?.email?.toLowerCase().trim() || "";
  const isAdmin = currentEmail === ADMIN_EMAIL.toLowerCase().trim();

  // Oxirgi 48 soat ichida admin profilini ko'rganlarni yuklash
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
      console.error("Supabase Profile Views Error:", error);
      alert(`Xatolik: ${error.message}`);
      return;
    }

    if (data) {
      setProfileViews(data);
      setShowProfileViewsModal(true);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const {
        data: { session: curSession },
      } = await supabase.auth.getSession();

      if (!isMounted) return;
      setSession(curSession);
      const viewerEmail = curSession?.user?.email?.toLowerCase().trim() || "";

      if (viewerEmail && profileEmail && viewerEmail === profileEmail) {
        router.replace("/profile");
        return;
      }

      if (!profileEmail) {
        setLoading(false);
        return;
      }

      // 1) Profilni topish
      const { data: viewedProfileData } = await supabase
        .from("profiles")
        .select("*")
        .or(`email.ilike.${profileEmail},username.ilike.${profileEmail}`)
        .maybeSingle();

      if (!isMounted) return;

      if (!viewedProfileData) {
        const { data: allProfs } = await supabase
          .from("profiles")
          .select("email, full_name, username, avatar_url, status");

        if (isMounted && allProfs) {
          const map: Record<string, ProfileData> = {};
          allProfs.forEach((p) => {
            if (p.email) {
              map[p.email.toLowerCase().trim()] = p;
              if (p.email.toLowerCase().trim() === viewerEmail)
                setIsCurrentUserBanned(p.status === "banned");
            }
          });
          setProfiles(map);
        }
        setLoading(false);
        return;
      }

      if (
        viewerEmail &&
        viewedProfileData.email?.toLowerCase().trim() === viewerEmail
      ) {
        router.replace("/profile");
        return;
      }

      setProfile(viewedProfileData);

      const targetEmail = viewedProfileData.email?.toLowerCase().trim() || "";
      const targetId = viewedProfileData.id;
      const isProfileAdminTarget = targetEmail === ADMIN_EMAIL.toLowerCase();

      // 48 soatlik profil tashrifi (await qo'shildi, ma'lumot yo'qolmasligi uchun)
      if (
        viewerEmail &&
        isProfileAdminTarget &&
        viewerEmail !== ADMIN_EMAIL.toLowerCase()
      ) {
        await supabase.from("profile_views").insert([
          {
            profile_email: ADMIN_EMAIL.toLowerCase(),
            viewer_email: viewerEmail,
          },
        ]);
      }

      const orFilter = targetId
        ? `user_email.eq.${targetEmail},user_id.eq.${targetId}`
        : `user_email.eq.${targetEmail}`;

      // 2) Parallel optimallashtirilgan so'rovlar
      const [
        { data: muteData },
        { data: blockData },
        { data: allPosts },
        { data: rawReactions },
        { data: rawComments },
        { data: allProfs },
        { data: sts },
      ] = await Promise.all([
        viewerEmail && targetEmail
          ? supabase
              .from("chat_mutes")
              .select("*")
              .eq("user_email", viewerEmail)
              .eq("target_email", targetEmail)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        viewerEmail && targetEmail
          ? supabase
              .from("blocked_users")
              .select("*")
              .eq("blocker_email", viewerEmail)
              .eq("blocked_email", targetEmail)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from("posts").select("id, content"),
        supabase.from("reactions").select("*").or(orFilter),
        supabase
          .from("comments")
          .select("*")
          .or(orFilter)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("email, full_name, username, avatar_url, status"),
        isProfileAdminTarget
          ? supabase
              .from("stories")
              .select("*")
              .ilike("user_email", viewedProfileData.email || "")
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as Story[] }),
      ]);

      if (!isMounted) return;

      setIsMuted(!!muteData);
      setAmIBlocking(!!blockData);

      const postMap: Record<number, string> = {};
      allPosts?.forEach((p) => {
        postMap[p.id] = p.content?.trim() || "Медиа публикация";
      });

      if (rawReactions) {
        setLikedPosts(
          rawReactions.map((r) => ({
            id: r.id,
            post_id: r.post_id,
            created_at: r.created_at || getNowIso(),
            post_content: postMap[r.post_id] || "Публикация #" + r.post_id,
          })),
        );
      }

      if (rawComments) {
        setUserComments(
          rawComments.map((c) => ({
            id: c.id,
            post_id: c.post_id,
            content: c.content,
            created_at: c.created_at,
            post_content: postMap[c.post_id] || "Публикация #" + c.post_id,
          })),
        );
      }

      if (allProfs) {
        const map: Record<string, ProfileData> = {};
        allProfs.forEach((p) => {
          if (p.email) {
            map[p.email.toLowerCase().trim()] = p;
            if (p.email.toLowerCase().trim() === viewerEmail)
              setIsCurrentUserBanned(p.status === "banned");
          }
        });
        setProfiles(map);
      }

      if (isProfileAdminTarget) {
        setUserStories(sts || []);
        const storyIds = (sts || []).map((s) => s.id);
        if (storyIds.length > 0) {
          const [{ data: stViews }, { data: stLikes }] = await Promise.all([
            supabase.from("story_views").select("*").in("story_id", storyIds),
            supabase.from("story_likes").select("*").in("story_id", storyIds),
          ]);

          if (isMounted) {
            if (stViews) setStoryViews(stViews);
            if (stLikes) setStoryLikes(stLikes);
          }
        } else {
          setStoryViews([]);
          setStoryLikes([]);
        }
      }

      setLoading(false);
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [profileEmail, router]);

  useEffect(() => {
    const targetEmail = profile?.email?.toLowerCase().trim();
    const myEmail = session?.user?.email?.toLowerCase().trim();

    if (!targetEmail || !myEmail) return;

    const handleSyncBlock = (e: Event) => {
      const { target, blocked } = (e as CustomEvent).detail;
      if (target === targetEmail) setAmIBlocking(blocked);
    };

    const handleSyncMute = (e: Event) => {
      const { target, muted } = (e as CustomEvent).detail;
      if (target === targetEmail) setIsMuted(muted);
    };

    window.addEventListener("sync-block", handleSyncBlock);
    window.addEventListener("sync-mute", handleSyncMute);

    return () => {
      window.removeEventListener("sync-block", handleSyncBlock);
      window.removeEventListener("sync-mute", handleSyncMute);
    };
  }, [profile, session]);

  useEffect(() => {
    if (videoRef.current) {
      if (isStoryPaused || !isMediaLoaded) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  }, [isStoryPaused, isMediaLoaded]);

  useEffect(() => {
    if (
      viewingStoryIndex === null ||
      isStoryPaused ||
      userStories.length === 0 ||
      !isMediaLoaded
    )
      return;

    const currentStory = userStories[viewingStoryIndex];
    const isVideo = currentStory.media_type === "video";
    const totalDurationMs = isVideo ? videoDuration * 1000 : 5000;
    const interval = 50;
    const step = 100 / (totalDurationMs / interval);

    const timer = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          if (viewingStoryIndex < userStories.length - 1) {
            setIsMediaLoaded(false);
            setViewingStoryIndex((i) => (i !== null ? i + 1 : null));
            return 0;
          } else {
            setViewingStoryIndex(null);
            return 0;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [
    viewingStoryIndex,
    isStoryPaused,
    userStories,
    videoDuration,
    isMediaLoaded,
  ]);

  useEffect(() => {
    if (
      viewingStoryIndex === null ||
      userStories.length === 0 ||
      !session?.user?.email
    )
      return;

    const currentStory = userStories[viewingStoryIndex];
    const viewerLocalEmail = session.user.email.toLowerCase().trim();

    if (currentStory.user_email.toLowerCase().trim() === viewerLocalEmail)
      return;

    const viewKey = `${currentStory.id}_${viewerLocalEmail}`;

    if (viewedSessionTracker.current.has(viewKey)) return;

    viewedSessionTracker.current.add(viewKey);

    const recordView = async () => {
      const alreadyViewedLocally = storyViews.some(
        (v) =>
          String(v.story_id) === String(currentStory.id) &&
          v.viewer_email === viewerLocalEmail,
      );

      if (!alreadyViewedLocally) {
        setStoryViews((prev) => [
          ...prev.filter(
            (v) =>
              !(
                String(v.story_id) === String(currentStory.id) &&
                v.viewer_email === viewerLocalEmail
              ),
          ),
          {
            id: getTempId(),
            story_id: currentStory.id,
            viewer_email: viewerLocalEmail,
            viewed_at: getNowIso(),
          },
        ]);

        await supabase
          .from("story_views")
          .insert([
            { story_id: currentStory.id, viewer_email: viewerLocalEmail },
          ]);
      }
    };

    recordView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingStoryIndex, userStories, session, storyViews]);

  const handleStoryLike = async (storyId: number) => {
    if (!session?.user?.email) return router.push("/login");

    if (isCurrentUserBanned) return alert("Ваш аккаунт заблокирован.");

    const emailLocal = session.user.email.toLowerCase().trim();

    const existing = storyLikes.find(
      (l) =>
        String(l.story_id) === String(storyId) && l.user_email === emailLocal,
    );

    if (existing) {
      setStoryLikes((prev) => prev.filter((l) => l.id !== existing.id));
      await supabase.from("story_likes").delete().eq("id", existing.id);
    } else {
      const tempId = getTempId();
      setStoryLikes((prev) => [
        ...prev,
        {
          id: tempId,
          story_id: storyId,
          user_email: emailLocal,
          created_at: getNowIso(),
        },
      ]);
      await supabase
        .from("story_likes")
        .insert([{ story_id: storyId, user_email: emailLocal }]);
    }
  };

  const handleToggleMute = async () => {
    if (!session?.user?.email || !profile?.email) return;

    const myEmail = session.user.email.toLowerCase().trim();
    const targetEmail = profile.email.toLowerCase().trim();
    const newMutedState = !isMuted;

    setIsMuted(newMutedState);

    window.dispatchEvent(
      new CustomEvent("sync-mute", {
        detail: { target: targetEmail, muted: newMutedState },
      }),
    );

    if (newMutedState) {
      await supabase
        .from("chat_mutes")
        .insert([{ user_email: myEmail, target_email: targetEmail }]);

      await recordActivity(
        myEmail,
        "Отключение звука чата",
        `Пользователь отключил уведомления от ${targetEmail}`,
      );
    } else {
      await supabase
        .from("chat_mutes")
        .delete()
        .match({ user_email: myEmail, target_email: targetEmail });

      await recordActivity(
        myEmail,
        "Включение звука чата",
        `Пользователь включил уведомления от ${targetEmail}`,
      );
    }
  };

  const handleToggleBlock = async () => {
    if (!session?.user?.email || !profile?.email) return;

    const myEmail = session.user.email.toLowerCase().trim();
    const targetEmail = profile.email.toLowerCase().trim();

    if (targetEmail === ADMIN_EMAIL.toLowerCase()) return;

    const newBlockState = !amIBlocking;
    setAmIBlocking(newBlockState);

    window.dispatchEvent(
      new CustomEvent("sync-block", {
        detail: { target: targetEmail, blocked: newBlockState },
      }),
    );

    if (newBlockState) {
      await supabase
        .from("blocked_users")
        .insert([{ blocker_email: myEmail, blocked_email: targetEmail }]);

      await recordActivity(
        myEmail,
        "Блокировка в чате",
        `Пользователь заблокировал ${targetEmail}`,
      );
    } else {
      await supabase
        .from("blocked_users")
        .delete()
        .match({ blocker_email: myEmail, blocked_email: targetEmail });

      await recordActivity(
        myEmail,
        "Разблокировка в чате",
        `Пользователь снял блокировку с ${targetEmail}`,
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-center px-4">
        <div>
          <p className="text-gray-500 font-medium mb-4">
            Пользователь не найден
          </p>
          <Link
            href="/"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const viewerEmail = session?.user?.email?.toLowerCase().trim() || "";
  const userStatus = profile.status || "active";
  const cleanUsername = profile.username
    ? profile.username.replace(/^@+/, "")
    : "";

  const isProfileAdmin =
    profile.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  const isAdminViewer = viewerEmail === ADMIN_EMAIL.toLowerCase().trim();

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
            {isProfileAdmin ? (
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
          <div
            onClick={() =>
              userStories.length > 0
                ? setViewingStoryIndex(0)
                : profile.avatar_url && setIsZoomed(true)
            }
            className={`relative mb-3 cursor-pointer p-0.5 rounded-full transition active:scale-95 ${userStories.length > 0 ? "bg-gradient-to-tr from-blue-600 to-cyan-400 p-[2px] shadow-sm animate-pulse" : "border-2 border-gray-100 dark:border-gray-800"}`}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border border-white dark:border-black bg-gray-100 dark:bg-[#1a1a1a]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center text-gray-400 font-bold text-2xl">
                {(profile.full_name || profile.email || "U")[0].toUpperCase()}
              </div>
            )}
          </div>

          <h2 className="text-base font-bold mb-0.5 text-gray-900 dark:text-gray-100">
            {profile.full_name ||
              (cleanUsername ? `@${cleanUsername}` : "Пользователь")}
          </h2>

          {isAdminViewer && (
            <p className="text-[11px] text-blue-500 flex items-center gap-1.5 font-bold mb-1 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg mt-1">
              <Mail className="w-3.5 h-3.5" />
              {profile.email} (Скрыто)
            </p>
          )}

          {userStories.length > 0 && (
            <button
              onClick={() => {
                setViewingStoryIndex(0);
                setStoryProgress(0);
              }}
              className="text-[10px] text-blue-500 font-bold mt-1.5 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3 h-3" /> Смотреть истории ({userStories.length}
              )
            </button>
          )}
        </div>

        {isAdminViewer && (
          <div className="grid grid-cols-2 gap-2.5 p-3 bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-gray-800/80 rounded-2xl mb-6 text-center">
            <button
              onClick={() => setActiveModal("likes")}
              className="hover:bg-white dark:hover:bg-black/40 p-2 rounded-xl transition active:scale-95 flex flex-col items-center border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer"
            >
              <div className="flex items-center justify-center gap-1 text-gray-400 text-[11px] mb-0.5">
                <Heart className="w-3 h-3 text-red-500" /> Лайки
              </div>
              <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                {likedPosts.length}
              </p>
            </button>
            <button
              onClick={() => setActiveModal("comments")}
              className="hover:bg-white dark:hover:bg-black/40 p-2 rounded-xl transition active:scale-95 flex flex-col items-center border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer"
            >
              <div className="flex items-center justify-center gap-1 text-gray-400 text-[11px] mb-0.5">
                <MessageSquare className="w-3 h-3 text-blue-500" /> Комменты
              </div>
              <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                {userComments.length}
              </p>
            </button>
          </div>
        )}

        <div className="space-y-4 mb-6 text-xs">
          <div>
            <span className="block font-semibold text-gray-500 mb-1 ml-1">
              Имя пользователя
            </span>
            <div className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-black dark:text-white">
              <AtSign className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="font-medium">
                {cleanUsername || "Не указано"}
              </span>
            </div>
          </div>

          <div>
            <span className="block font-semibold text-gray-500 mb-1 ml-1">
              О себе
            </span>
            <div className="w-full bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 min-h-[50px] whitespace-pre-wrap text-black dark:text-white leading-relaxed">
              {profile.bio || "Нет описания..."}
            </div>
          </div>

          {isAdminViewer && profile.phone && (
            <div>
              <span className="block font-semibold text-blue-500 mb-1 ml-1">
                Номер телефона (Скрыто)
              </span>
              <div className="w-full bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-blue-700 dark:text-blue-400 font-mono font-bold">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{profile.phone}</span>
              </div>
            </div>
          )}

          {isAdminViewer && profile.birth_date && (
            <div>
              <span className="block font-semibold text-emerald-500 mb-1 ml-1">
                Дата рождения (Скрыто)
              </span>
              <div className="w-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {new Date(profile.birth_date).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {viewerEmail &&
          profile.email &&
          viewerEmail !== profile.email.toLowerCase().trim() && (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-800/80">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setSpyTargetEmail(undefined);
                  window.dispatchEvent(
                    new CustomEvent("open-chat", { detail: profile.email }),
                  );
                }}
                className="relative z-10 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition active:scale-95 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" /> Написать
                сообщение
              </button>

              {isAdminViewer && (
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    const target = profile.email?.toLowerCase().trim();
                    setSpyTargetEmail(target);
                    await recordActivity(
                      viewerEmail,
                      "Просмотр чатов (Spy)",
                      `Администратор вошел в режим просмотра сообщений пользователя ${target}`,
                    );
                    window.dispatchEvent(
                      new CustomEvent("open-chat", { detail: profile.email }),
                    );
                  }}
                  className="relative z-10 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition active:scale-95 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Eye className="w-4 h-4" /> Посмотреть чаты пользователя (Spy)
                </button>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleToggleMute}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition active:scale-95 border cursor-pointer ${isMuted ? "bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40"}`}
                >
                  {isMuted ? (
                    <BellOff className="w-3.5 h-3.5" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                  {isMuted ? "Включить звук" : "Без звука"}
                </button>

                {!isProfileAdmin && (
                  <button
                    onClick={handleToggleBlock}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition active:scale-95 border cursor-pointer ${amIBlocking ? "bg-red-500 text-white border-red-600 hover:bg-red-600" : "bg-red-50 dark:bg-red-950/20 text-red-500 border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-950/40"}`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {amIBlocking ? "Разблокировать" : "Заблокировать"}
                  </button>
                )}
              </div>
            </div>
          )}

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded-xl mt-6">
          <span className="font-semibold text-gray-500 flex items-center gap-1.5 text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            Статус аккаунта
          </span>

          <span
            className={`font-bold text-xs ${userStatus === "banned" ? "text-red-500" : "text-emerald-500"}`}
          >
            {userStatus === "banned" ? "Заблокирован" : "Активен"}
          </span>
        </div>
      </div>

      {/* Hikoya Ko'rish Modali */}
      {viewingStoryIndex !== null && userStories[viewingStoryIndex] && (
        <div
          className="fixed inset-0 z-[120] bg-black flex items-center justify-center select-none animate-in fade-in duration-200"
          onMouseDown={() => setIsStoryPaused(true)}
          onMouseUp={() => setIsStoryPaused(false)}
          onTouchStart={() => setIsStoryPaused(true)}
          onTouchEnd={() => setIsStoryPaused(false)}
        >
          <div className="relative w-full max-w-md h-full sm:h-[92vh] sm:rounded-3xl overflow-hidden bg-[#0a0a0a] flex flex-col justify-between shadow-2xl border border-white/10">
            <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
              {userStories.map((s, idx) => {
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
                  src={profile.avatar_url || "/avatar-placeholder.png"}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-white/40"
                />
                <div className="leading-tight text-left">
                  <p className="text-xs font-bold truncate max-w-[140px]">
                    {profile.full_name ||
                      (cleanUsername ? `@${cleanUsername}` : "Пользователь")}
                  </p>
                  <p className="text-[10px] text-white/70">
                    {new Date(
                      userStories[viewingStoryIndex].created_at,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdminViewer && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const stId = userStories[viewingStoryIndex].id;
                      if (confirm("Удалить эту историю?")) {
                        supabase
                          .from("stories")
                          .delete()
                          .eq("id", stId)
                          .then(() => {
                            setUserStories((prev) =>
                              prev.filter((s) => s.id !== stId),
                            );
                            setViewingStoryIndex(null);
                          });
                      }
                    }}
                    className="p-1.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-red-500 transition text-white cursor-pointer"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingStoryIndex(null);
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

              {userStories[viewingStoryIndex].media_type === "video" ? (
                <video
                  ref={videoRef}
                  src={userStories[viewingStoryIndex].media_url}
                  autoPlay
                  playsInline
                  muted={false}
                  onLoadedData={() => setIsMediaLoaded(true)}
                  onLoadedMetadata={(e) => {
                    setVideoDuration(e.currentTarget.duration || 5);
                    setIsMediaLoaded(true);
                  }}
                  className={`w-full h-full object-contain transition-opacity duration-300 ${isMediaLoaded ? "opacity-100" : "opacity-0"}`}
                  onEnded={() => {
                    if (viewingStoryIndex < userStories.length - 1) {
                      setIsMediaLoaded(false);
                      setViewingStoryIndex((i) => (i !== null ? i + 1 : null));
                      setStoryProgress(0);
                    } else {
                      setViewingStoryIndex(null);
                      setStoryProgress(0);
                    }
                  }}
                />
              ) : (
                <img
                  src={userStories[viewingStoryIndex].media_url}
                  alt=""
                  onLoad={() => setIsMediaLoaded(true)}
                  className={`w-full h-full object-contain transition-opacity duration-300 ${isMediaLoaded ? "opacity-100" : "opacity-0"}`}
                />
              )}

              <div
                className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (viewingStoryIndex > 0) {
                    setIsMediaLoaded(false);
                    setViewingStoryIndex((i) => (i !== null ? i - 1 : null));
                    setStoryProgress(0);
                  }
                }}
              />
              <div
                className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (viewingStoryIndex < userStories.length - 1) {
                    setIsMediaLoaded(false);
                    setViewingStoryIndex((i) => (i !== null ? i + 1 : null));
                    setStoryProgress(0);
                  } else {
                    setViewingStoryIndex(null);
                    setStoryProgress(0);
                  }
                }}
              />
            </div>

            <div className="absolute bottom-4 inset-x-4 z-30 flex flex-col gap-2.5 pointer-events-auto">
              {userStories[viewingStoryIndex].caption && (
                <div className="p-3 bg-black/60 backdrop-blur-md rounded-2xl text-white text-xs leading-relaxed text-center pointer-events-none">
                  {userStories[viewingStoryIndex].caption}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                {viewerEmail &&
                  viewerEmail !== ADMIN_EMAIL.toLowerCase().trim() && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStoryLike(userStories[viewingStoryIndex].id);
                      }}
                      className={`p-2.5 rounded-full backdrop-blur-md transition active:scale-75 flex items-center justify-center shadow-lg border border-white/10 cursor-pointer ${storyLikes.some((l) => String(l.story_id) === String(userStories[viewingStoryIndex].id) && l.user_email === viewerEmail) ? "bg-red-600 text-white shadow-red-500/50" : "bg-black/60 hover:bg-black/80 text-white"}`}
                    >
                      <Heart
                        className={`w-5 h-5 ${storyLikes.some((l) => String(l.story_id) === String(userStories[viewingStoryIndex].id) && l.user_email === viewerEmail) ? "fill-white stroke-white scale-110" : "fill-transparent stroke-white"} transition-all duration-200`}
                      />
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 AVATAR ZOOM QISMI (Cho'zilib ketishi to'g'rilandi, qolgani eski kodingiz kabi) */}
      {isZoomed && profile.avatar_url && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div className="relative max-w-sm w-full flex items-center justify-center">
            <img
              src={profile.avatar_url}
              alt="Zoomed Avatar"
              className="w-full aspect-square rounded-[2rem] object-cover shadow-2xl border-4 border-gray-800"
            />
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isAdminViewer && activeModal && (
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
                    <span className="font-bold text-xs">Комментарии</span>
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
                    Нет данных
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
                          ID: #{item.post_id}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 shrink-0" />
                    </Link>
                  ))
                )
              ) : userComments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  Нет данных
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
                          dateStyle: "short",
                          timeStyle: "short",
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
        isBanned={userStatus === "banned"}
        profiles={profiles}
        spyUserEmail={spyTargetEmail}
      />
    </div>
  );
}
