"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageCircle,
  Send,
  X,
  Loader2,
  ArrowLeft,
  Smile,
  Ban,
  Bell,
  BellOff,
  ShieldCheck,
  Reply,
  Check,
  CheckCheck,
  Trash2,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";

interface DirectMessage {
  id: number;
  sender_email: string;
  receiver_email: string;
  content: string;
  type: string;
  is_read: boolean;
  reply_to_id?: number | null;
  created_at: string;
}

interface ProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  last_seen?: string;
  email?: string;
  [key: string]: unknown;
}

interface ChatHubProps {
  session: Session | null;
  isBanned: boolean;
  profiles: Record<string, ProfileData>;
  spyUserEmail?: string;
}

const EMOJIS = [
  // 🟢 Yuz ifodalari (Quvonch va kulgi)
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "🥲",
  "🥹",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😝",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🥸",
  "🤩",
  "🥳",
  "😏",
  "😒",

  // 🟡 Yuz ifodalari (Hissiyotlar va xafalik)
  "😞",
  "😔",
  "😟",
  "😕",
  "🙁",
  "☹️",
  "😣",
  "😖",
  "😫",
  "😩",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "🤯",
  "😳",
  "🥵",
  "🥶",
  "😱",
  "😨",
  "😰",
  "😥",
  "😓",
  "🫣",
  "🤗",
  "🤔",
  "🫡",
  "🤫",
  "🫠",
  "🤥",
  "😶",
  "😐",
  "😑",
  "😬",
  "🙄",
  "😯",
  "😦",
  "😧",
  "😮",
  "😲",
  "🥱",
  "😴",
  "🤤",
  "😪",
  "😮‍💨",
  "😵",
  "😵‍💫",
  "🤐",
  "🥴",
  "🤢",
  "🤮",
  "🤧",
  "😷",
  "🤒",
  "🤕",
  "🤑",

  // 👋 Qo'l ishoralari
  "👋",
  "🤚",
  "🖐",
  "✋",
  "🖖",
  "👌",
  "🤌",
  "🤏",
  "✌️",
  "🤞",
  "🫰",
  "🤟",
  "🤘",
  "🤙",
  "👈",
  "👉",
  "👆",
  "🖕",
  "👇",
  "☝️",
  "👍",
  "👎",
  "✊",
  "👊",
  "🤛",
  "🤜",
  "👏",
  "🙌",
  "👐",
  "🤲",
  "🤝",
  "🙏",
  "✍️",
  "💅",
  "🤳",
  "💪",
  "🦾",

  // ❤️ Yuraklar
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "💔",
  "❤️‍🔥",
  "❤️‍🩹",
  "❣️",
  "💕",
  "💞",
  "💓",
  "💗",
  "💖",
  "💘",
  "💝",

  // ✨ Belgilar va Tabiat
  "✨",
  "⭐️",
  "🌟",
  "💫",
  "💥",
  "🔥",
  "💨",
  "💦",
  "💧",
  "💤",
  "💬",
  "👁️‍🗨️",
  "🗯",
  "💭",
  "💯",
  "💢",
  "🛑",
  "⚠️",
  "✅",
  "❌",
  "🌍",
  "🌙",
  "☀️",
  "☁️",
  "⚡️",
  "❄️",
  "🔥",
  "🎉",
  "🎁",
  "🎈",

  // 🐱 Hayvonlar va O'simliklar
  "🐶",
  "🐱",
  "🐭",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐸",
  "🐒",
  "🐔",
  "🐧",
  "🐦",
  "🦋",
  "🌹",
  "🥀",
  "🌺",
  "🌻",
  "🌼",
  "🍀",
  "🪴",

  // 🍕 Ovqat va Ichimliklar
  "🍎",
  "🍓",
  "🍒",
  "🍉",
  "🍌",
  "🍇",
  "🍕",
  "🍔",
  "🍟",
  "🌭",
  "🍿",
  "🍩",
  "🍪",
  "🍫",
  "🍬",
  "☕",
  "🧋",
  "🍹",
  "🥂",
  "🎂",
];

const ADMIN_EMAIL = "urokov.me@gmail.com";

export function ChatHub({
  session,
  isBanned,
  profiles: initialProfiles,
  spyUserEmail,
}: ChatHubProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";

  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTargetLastSeen, setActiveTargetLastSeen] = useState<
    string | null
  >(null);

  const [syncedProfiles, setSyncedProfiles] = useState<
    Record<string, ProfileData>
  >({});
  const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);

  // 🔴 UNIVERSAL SWIPE-TO-REPLY
  const [swipingId, setSwipingId] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const pointerStartX = useRef<number | null>(null);

  const [mutedChats, setMutedChats] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<
    { blocker: string; blocked: string }[]
  >([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "chat" | "message";
    item: DirectMessage | string;
  } | null>(null);

  const [currentTime, setCurrentTime] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const blockedUsersRef = useRef(blockedUsers);
  const mutedChatsRef = useRef(mutedChats);

  // 🔴 BROWSER TARIXI UCHUN REFLAR
  const isOpenRef = useRef(isOpen);
  const activeChatRef = useRef(activeChat);
  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);

  useEffect(() => {
    isOpenRef.current = isOpen;
    activeChatRef.current = activeChat;
    pathnameRef.current = pathname;
    routerRef.current = router;
  }, [isOpen, activeChat, pathname, router]);

  // 🔴 POPSTATE (TELEFON "ORQAGA" TUGMASINI) ESHITISH VA ASOSIY SAHIFAGA OTISH
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as { chatStep?: string; email?: string } | null;
      if (state?.chatStep === "chat") {
        setIsOpen(true);
        setActiveChat(state.email || null);
      } else if (state?.chatStep === "list") {
        setIsOpen(true);
        setActiveChat(null);
      } else {
        setIsOpen(false);
        setActiveChat(null);
        // Agar profil sahifasidan kelgan bo'lsangiz va oynani yopsangiz, asosiyga otadi
        if (pathnameRef.current !== "/") {
          routerRef.current.push("/");
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // 🔴 MODALNI YOPISH
  const handleCloseModal = () => {
    if (isOpenRef.current) {
      const steps = activeChatRef.current ? -2 : -1;
      window.history.go(steps);
    } else {
      setIsOpen(false);
      setActiveChat(null);
    }
  };

  const myEmail = session?.user?.email?.toLowerCase().trim() || "";
  const isAdmin = myEmail === ADMIN_EMAIL;
  const currentSpyEmail = spyUserEmail?.toLowerCase().trim() || "";

  useEffect(() => {
    if (currentSpyEmail && isAdmin) {
      setTimeout(() => {
        if (!isOpenRef.current) {
          window.history.pushState({ chatStep: "list" }, "");
          window.history.pushState(
            { chatStep: "chat", email: currentSpyEmail },
            "",
          );
        } else {
          if (activeChatRef.current) {
            window.history.replaceState(
              { chatStep: "chat", email: currentSpyEmail },
              "",
            );
          } else {
            window.history.pushState(
              { chatStep: "chat", email: currentSpyEmail },
              "",
            );
          }
        }
        setIsOpen(true);
        setActiveChat(currentSpyEmail);
      }, 100);
    }
  }, [currentSpyEmail, isAdmin]);

  useEffect(() => {
    blockedUsersRef.current = blockedUsers;
  }, [blockedUsers]);

  useEffect(() => {
    mutedChatsRef.current = mutedChats;
  }, [mutedChats]);

  useEffect(() => {
    const timeout = setTimeout(() => setCurrentTime(Date.now()), 0);
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const playMessageSound = (senderEmail: string) => {
    const isMuted = mutedChatsRef.current.some(
      (m) => m.toLowerCase() === senderEmail.toLowerCase(),
    );
    if (isMuted) return;
    try {
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});
    } catch {
      /* ignore */
    }
  };

  const liveProfiles = { ...(initialProfiles || {}), ...syncedProfiles };

  useEffect(() => {
    let isMounted = true;
    const profileChannel = supabase
      .channel("live-profiles-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          if (!isMounted) return;
          const updated = payload.new as ProfileData;
          if (updated && updated.email) {
            const eml = updated.email.toLowerCase().trim();
            setSyncedProfiles((prev) => ({
              ...prev,
              [eml]: { ...prev[eml], ...updated },
            }));
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(profileChannel);
    };
  }, []);

  useEffect(() => {
    if (!myEmail) return;
    const updatePresence = async () => {
      if (isAdmin && currentSpyEmail) return;
      await supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("email", myEmail);
    };
    updatePresence();
    const interval = setInterval(updatePresence, 15000);
    return () => clearInterval(interval);
  }, [myEmail, isAdmin, currentSpyEmail]);

  useEffect(() => {
    if (!activeChat) return;
    const fetchTargetStatus = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("last_seen")
        .eq("email", activeChat)
        .single();
      if (data) setActiveTargetLastSeen(data.last_seen);
    };
    fetchTargetStatus();
    const interval = setInterval(fetchTargetStatus, 10000);
    return () => clearInterval(interval);
  }, [activeChat]);

  useEffect(() => {
    const handleOpenChatEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const targetEmail = customEvent.detail.toLowerCase().trim();
        setTimeout(() => {
          if (!isOpenRef.current) {
            window.history.pushState({ chatStep: "list" }, "");
            window.history.pushState(
              { chatStep: "chat", email: targetEmail },
              "",
            );
          } else {
            if (activeChatRef.current) {
              window.history.replaceState(
                { chatStep: "chat", email: targetEmail },
                "",
              );
            } else {
              window.history.pushState(
                { chatStep: "chat", email: targetEmail },
                "",
              );
            }
          }
          setIsOpen(true);
          setActiveChat(targetEmail);
        }, 0);
      }
    };

    const handleSyncBlock = (e: Event) => {
      const { target, blocked } = (e as CustomEvent).detail;
      setBlockedUsers((prev) =>
        blocked
          ? [
              ...prev.filter(
                (b) => !(b.blocker === myEmail && b.blocked === target),
              ),
              { blocker: myEmail, blocked: target },
            ]
          : prev.filter(
              (b) => !(b.blocker === myEmail && b.blocked === target),
            ),
      );
    };

    const handleSyncMute = (e: Event) => {
      const { target, muted } = (e as CustomEvent).detail;
      setMutedChats((prev) =>
        muted
          ? [...new Set([...prev, target])]
          : prev.filter((m) => m !== target),
      );
    };

    window.addEventListener("open-chat", handleOpenChatEvent);
    window.addEventListener("sync-block", handleSyncBlock);
    window.addEventListener("sync-mute", handleSyncMute);
    return () => {
      window.removeEventListener("open-chat", handleOpenChatEvent);
      window.removeEventListener("sync-block", handleSyncBlock);
      window.removeEventListener("sync-mute", handleSyncMute);
    };
  }, [myEmail]);

  useEffect(() => {
    if (!myEmail) return;
    const params = new URLSearchParams(window.location.search);
    const chatTarget = params.get("chat");
    if (chatTarget) {
      const targetEmail = chatTarget.toLowerCase().trim();
      setTimeout(() => {
        window.history.replaceState(
          null,
          document.title,
          window.location.pathname,
        );
        window.history.pushState({ chatStep: "list" }, "");
        window.history.pushState({ chatStep: "chat", email: targetEmail }, "");
        setIsOpen(true);
        setActiveChat(targetEmail);
      }, 0);
    }
  }, [myEmail]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        contextMenuRef.current.contains(e.target as Node)
      )
        return;
      if (contextMenu) setContextMenu(null);
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleCloseModal();
      }
    };
    if (isOpen || contextMenu)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, contextMenu]);

  useEffect(() => {
    if (!myEmail) return;
    let isMounted = true;

    const fetchBlocksAndMutes = async () => {
      const { data: blockedByMe } = await supabase
        .from("blocked_users")
        .select("*")
        .eq("blocker_email", myEmail);
      const { data: blockedMe } = await supabase
        .from("blocked_users")
        .select("*")
        .eq("blocked_email", myEmail);
      if (isMounted)
        setBlockedUsers(
          [...(blockedByMe || []), ...(blockedMe || [])].map((b) => ({
            blocker: b.blocker_email,
            blocked: b.blocked_email,
          })),
        );

      const { data: mutData } = await supabase
        .from("chat_mutes")
        .select("target_email")
        .eq("user_email", myEmail);
      if (isMounted && mutData)
        setMutedChats(mutData.map((m) => m.target_email));
    };

    const loadMessages = async () => {
      const queryEmail = isAdmin && currentSpyEmail ? currentSpyEmail : myEmail;

      const { data: msgData } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_email.eq.${queryEmail},receiver_email.eq.${queryEmail}`)
        .order("created_at", { ascending: false });

      if (isMounted && msgData) {
        setMessages(msgData.reverse() as DirectMessage[]);
        setUnreadCount(
          msgData.filter((m) => m.receiver_email === queryEmail && !m.is_read)
            .length,
        );
      }
    };

    fetchBlocksAndMutes();
    loadMessages();

    const channel = supabase
      .channel("chat-system")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as DirectMessage;
            const queryEmail =
              isAdmin && currentSpyEmail ? currentSpyEmail : myEmail;

            if (newMsg.sender_email !== queryEmail) {
              const isBlockedByUs = blockedUsersRef.current.some(
                (b) =>
                  b.blocker === queryEmail && b.blocked === newMsg.sender_email,
              );
              if (isBlockedByUs) return;
            }

            if (
              newMsg.sender_email === queryEmail ||
              newMsg.receiver_email === queryEmail
            ) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });

              if (newMsg.receiver_email === myEmail) {
                if (
                  !isOpenRef.current ||
                  activeChatRef.current !== newMsg.sender_email
                ) {
                  setUnreadCount((prev) => prev + 1);
                  playMessageSound(newMsg.sender_email);
                } else {
                  playMessageSound(newMsg.sender_email);
                }
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as DirectMessage;
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m)),
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "blocked_users" },
        () => fetchBlocksAndMutes(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_mutes" },
        () => fetchBlocksAndMutes(),
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEmail, currentSpyEmail, isAdmin]);

  useEffect(() => {
    if (isOpen && activeChat) {
      const isSpying = isAdmin && currentSpyEmail !== "";

      if (!isSpying) {
        const unreadIds = messages
          .filter(
            (m) =>
              m.receiver_email === myEmail &&
              m.sender_email === activeChat &&
              !m.is_read,
          )
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          supabase
            .from("direct_messages")
            .update({ is_read: true })
            .in("id", unreadIds)
            .then(() => {
              setMessages((prev) =>
                prev.map((m) =>
                  unreadIds.includes(m.id) ? { ...m, is_read: true } : m,
                ),
              );
              setUnreadCount((prev) => Math.max(0, prev - unreadIds.length));
            });
        }
      }

      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  }, [isOpen, activeChat, messages, myEmail, isAdmin, currentSpyEmail]);

  // 🔴 POINTER EVENTS
  const handlePointerDown = (e: React.PointerEvent, msg: DirectMessage) => {
    if (e.button !== 0) return;
    pointerStartX.current = e.clientX;
    setSwipingId(msg.id);
    setSwipeOffset(0);

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}

    isLongPress.current = false;
    if (pressTimer.current) clearTimeout(pressTimer.current);

    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (
        typeof window !== "undefined" &&
        window.navigator &&
        window.navigator.vibrate
      ) {
        window.navigator.vibrate(50);
      }
      const x = Math.min(e.clientX, window.innerWidth - 240);
      const y = Math.min(e.clientY, window.innerHeight - 200);
      setContextMenu({ x, y, type: "message", item: msg });

      setSwipingId(null);
      setSwipeOffset(0);
    }, 400);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isLongPress.current || contextMenu) return;

    if (pointerStartX.current !== null && swipingId !== null) {
      const diff = e.clientX - pointerStartX.current;
      if (Math.abs(diff) > 10 && pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
      if (diff < 0) {
        setSwipeOffset(Math.max(diff, -60));
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent, msg: DirectMessage) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);

    if (!isLongPress.current && pointerStartX.current !== null) {
      if (swipeOffset <= -40) {
        setReplyingTo(msg);
        if (
          typeof window !== "undefined" &&
          window.navigator &&
          window.navigator.vibrate
        ) {
          window.navigator.vibrate(50);
        }
      }
    }

    setSwipingId(null);
    setSwipeOffset(0);
    pointerStartX.current = null;

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleChatTouchStart = (
    e: React.TouchEvent | React.MouseEvent,
    item: string,
  ) => {
    isLongPress.current = false;
    if (pressTimer.current) clearTimeout(pressTimer.current);

    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (
        typeof window !== "undefined" &&
        window.navigator &&
        window.navigator.vibrate
      )
        window.navigator.vibrate(50);
      const x = Math.min(clientX, window.innerWidth - 240);
      const y = Math.min(clientY, window.innerHeight - 200);
      setContextMenu({ x, y, type: "chat", item });
    }, 400);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleChatClick = (email: string) => {
    if (isLongPress.current) return;
    if (activeChatRef.current) {
      window.history.replaceState({ chatStep: "chat", email }, "");
    } else {
      window.history.pushState({ chatStep: "chat", email }, "");
    }
    setActiveChat(email);
  };

  const toggleMute = async (targetEmail: string) => {
    if (!targetEmail) return;
    const isMuted = mutedChats.includes(targetEmail);
    const newMutedState = !isMuted;

    setMutedChats((prev) =>
      newMutedState
        ? [...prev, targetEmail]
        : prev.filter((e) => e !== targetEmail),
    );
    window.dispatchEvent(
      new CustomEvent("sync-mute", {
        detail: { target: targetEmail, muted: newMutedState },
      }),
    );

    if (newMutedState) {
      await supabase
        .from("chat_mutes")
        .insert([{ user_email: myEmail, target_email: targetEmail }]);
    } else {
      await supabase
        .from("chat_mutes")
        .delete()
        .match({ user_email: myEmail, target_email: targetEmail });
    }
  };

  const toggleBlock = async (targetEmail: string) => {
    if (!targetEmail || targetEmail === ADMIN_EMAIL) return;
    const amIBlocking = blockedUsers.some(
      (b) => b.blocker === myEmail && b.blocked === targetEmail,
    );
    const newBlockState = !amIBlocking;

    setBlockedUsers((prev) =>
      newBlockState
        ? [
            ...prev.filter(
              (b) => !(b.blocker === myEmail && b.blocked === targetEmail),
            ),
            { blocker: myEmail, blocked: targetEmail },
          ]
        : prev.filter(
            (b) => !(b.blocker === myEmail && b.blocked === targetEmail),
          ),
    );
    window.dispatchEvent(
      new CustomEvent("sync-block", {
        detail: { target: targetEmail, blocked: newBlockState },
      }),
    );

    if (newBlockState) {
      await supabase
        .from("blocked_users")
        .insert([{ blocker_email: myEmail, blocked_email: targetEmail }]);
    } else {
      await supabase
        .from("blocked_users")
        .delete()
        .match({ blocker_email: myEmail, blocked_email: targetEmail });
    }
  };

  const deleteChat = async (targetEmail: string) => {
    if (myEmail !== ADMIN_EMAIL) return;
    if (confirm("Вы уверены, что хотите безвозвратно удалить весь чат?")) {
      setMessages((prev) =>
        prev.filter(
          (m) =>
            !(
              m.sender_email === targetEmail || m.receiver_email === targetEmail
            ),
        ),
      );
      if (activeChat === targetEmail) setActiveChat(null);
      await supabase
        .from("direct_messages")
        .delete()
        .or(
          `and(sender_email.eq.${myEmail},receiver_email.eq.${targetEmail}),and(sender_email.eq.${targetEmail},receiver_email.eq.${myEmail})`,
        );
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin && currentSpyEmail) return;

    if (!myEmail || isBanned || !input.trim() || isSending || !activeChat)
      return;

    const amIBlocking = blockedUsers.some(
      (b) => b.blocker === myEmail && b.blocked === activeChat,
    );
    const isBlockedByThem = blockedUsers.some(
      (b) => b.blocker === activeChat && b.blocked === myEmail,
    );
    if (amIBlocking || isBlockedByThem) return;

    setIsSending(true);
    const textToSend = input.trim();
    const replyId = replyingTo ? replyingTo.id : null;
    setInput("");
    setReplyingTo(null);
    setShowStickers(false);

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .insert([
          {
            sender_email: myEmail,
            receiver_email: activeChat,
            content: textToSend,
            type: "text",
            reply_to_id: replyId,
            is_read: false,
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newMsg = data[0] as DirectMessage;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          50,
        );

        const myProfile = liveProfiles[myEmail];
        const myName = myProfile?.username
          ? `@${myProfile.username}`
          : myProfile?.full_name || myEmail.split("@")[0];

        await supabase.from("notifications").insert([
          {
            user_email: activeChat,
            actor_name: myName,
            actor_avatar: myProfile?.avatar_url || "",
            type: "message",
            title: "Новое сообщение",
            message:
              textToSend.length > 30
                ? textToSend.substring(0, 30) + "..."
                : textToSend,
            is_read: false,
          },
        ]);
      }
    } catch (error: unknown) {
      console.log(error);
    } finally {
      setIsSending(false);
    }
  };

  const contactsMap = new Map<string, DirectMessage>();
  const baseEmailForContacts =
    isAdmin && currentSpyEmail ? currentSpyEmail : myEmail;

  messages.forEach((m) => {
    const other =
      m.sender_email === baseEmailForContacts
        ? m.receiver_email
        : m.sender_email;
    if (
      !contactsMap.has(other) ||
      new Date(contactsMap.get(other)!.created_at) < new Date(m.created_at)
    ) {
      contactsMap.set(other, m);
    }
  });

  const contacts = Array.from(contactsMap.entries())
    .sort(
      (a, b) =>
        new Date(b[1].created_at).getTime() -
        new Date(a[1].created_at).getTime(),
    )
    .reverse();

  const activeTargetProf = activeChat ? liveProfiles[activeChat] : null;
  const activeTargetName = activeTargetProf?.username
    ? `@${activeTargetProf.username}`
    : activeTargetProf?.full_name ||
      (activeChat ? activeChat.split("@")[0] : "");
  const activeTargetAvatar =
    activeTargetProf?.avatar_url || "/avatar-placeholder.png";

  const activeChatMsgs = activeChat
    ? messages.filter((m) => {
        if (isAdmin && currentSpyEmail) {
          return (
            (m.sender_email === currentSpyEmail &&
              m.receiver_email === activeChat) ||
            (m.sender_email === activeChat &&
              m.receiver_email === currentSpyEmail)
          );
        }
        return (
          (m.sender_email === myEmail && m.receiver_email === activeChat) ||
          (m.sender_email === activeChat && m.receiver_email === myEmail)
        );
      })
    : [];

  const amIBlockingActive = activeChat
    ? blockedUsers.some(
        (b) => b.blocker === myEmail && b.blocked === activeChat,
      )
    : false;
  const isBlockedByThemActive = activeChat
    ? blockedUsers.some(
        (b) => b.blocker === activeChat && b.blocked === myEmail,
      )
    : false;
  const isMutedActive = activeChat ? mutedChats.includes(activeChat) : false;

  const isUserOnline = (lastSeen?: string | null) => {
    if (!lastSeen) return false;
    const diffMs = currentTime - new Date(lastSeen).getTime();
    return Math.floor(diffMs / 60000) < 3;
  };

  const getStatusText = () => {
    if (!activeTargetLastSeen) return "Был(а) недавно";
    if (isUserOnline(activeTargetLastSeen)) return "В сети";
    const diffMs = currentTime - new Date(activeTargetLastSeen).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 60) return `Был(а) ${diffMinutes} минут назад`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Был(а) ${diffHours} часов назад`;
    return new Date(activeTargetLastSeen).toLocaleDateString([], {
      day: "numeric",
      month: "long",
    });
  };
  const statusText = getStatusText();

  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 flex flex-col items-end pointer-events-none select-none z-[100]">
      {isOpen && (
        <div
          className="fixed inset-0 sm:inset-6 md:inset-10 bg-black/60 backdrop-blur-sm sm:rounded-[2rem] flex overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 pointer-events-auto z-[110]"
          ref={modalRef}
        >
          <div
            className={`${activeChat ? "hidden sm:flex" : "flex"} w-full sm:w-[320px] shrink-0 bg-white dark:bg-[#111] border-r border-gray-100 dark:border-gray-800 flex-col h-full relative`}
          >
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h2 className="font-extrabold text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500 fill-blue-500/20" />{" "}
                Чаты{" "}
                {isAdmin && currentSpyEmail && (
                  <span className="text-[10px] text-emerald-500 font-mono">
                    (Spy)
                  </span>
                )}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition sm:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-2">
              {contacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  У вас пока нет чатов
                </div>
              ) : (
                contacts.map(([email, lastMsg]) => {
                  const prof = liveProfiles[email];
                  const cName = prof?.username
                    ? `@${prof.username}`
                    : prof?.full_name || email.split("@")[0];
                  const checkEmailForUnread =
                    isAdmin && currentSpyEmail ? currentSpyEmail : myEmail;
                  const unread = messages.filter(
                    (m) =>
                      m.receiver_email === checkEmailForUnread &&
                      m.sender_email === email &&
                      !m.is_read,
                  ).length;
                  const isMutedContact = mutedChats.includes(email);
                  const online = isUserOnline(prof?.last_seen);

                  return (
                    <div
                      key={email}
                      onClick={() => handleChatClick(email)}
                      onMouseDown={(e) => handleChatTouchStart(e, email)}
                      onMouseUp={handleTouchEnd}
                      onMouseLeave={handleTouchEnd}
                      onTouchStart={(e) => handleChatTouchStart(e, email)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchEnd}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleTouchEnd();
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition ${activeChat === email ? "bg-blue-50 dark:bg-blue-900/30" : "hover:bg-gray-50 dark:hover:bg-[#222]"}`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={prof?.avatar_url || "/avatar-placeholder.png"}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover bg-gray-100 dark:bg-gray-800 pointer-events-none"
                        />
                        {online && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 border-2 border-white dark:border-[#111] rounded-full shadow-sm" />
                        )}
                        {myEmail === ADMIN_EMAIL && email === ADMIN_EMAIL && (
                          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-black rounded-full p-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                            {cName}
                            {isMutedContact && (
                              <BellOff className="w-3 h-3 text-gray-400 shrink-0" />
                            )}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                            {new Date(lastMsg.created_at).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p
                            className={`text-xs truncate ${unread > 0 ? "text-gray-900 dark:text-white font-semibold" : "text-gray-500"}`}
                          >
                            {lastMsg.content}
                          </p>
                          {unread > 0 && (
                            <span
                              className={`w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 ml-2 ${isMutedContact ? "bg-gray-400 text-white" : "bg-blue-500 text-white"}`}
                            >
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {contextMenu && contextMenu.type === "chat" && (
              <div
                ref={contextMenuRef}
                className="absolute z-[9999] w-56 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] p-2 flex flex-col animate-in zoom-in-95 duration-150 origin-top-left"
                style={{ top: contextMenu.y, left: contextMenu.x }}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Действия
                </div>
                <button
                  onClick={() => {
                    toggleMute(contextMenu.item as string);
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-xs font-bold transition text-gray-800 dark:text-gray-200"
                >
                  {mutedChats.includes(contextMenu.item as string) ? (
                    <>
                      <Bell className="w-4 h-4 text-blue-500" />{" "}
                      <span className="text-blue-500">Включить звук</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-4 h-4 text-gray-500" /> Без звука
                    </>
                  )}
                </button>
                {contextMenu.item !== ADMIN_EMAIL && (
                  <button
                    onClick={() => {
                      toggleBlock(contextMenu.item as string);
                      setContextMenu(null);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-xs font-bold transition text-gray-800 dark:text-gray-200"
                  >
                    <Ban className="w-4 h-4 text-gray-500" />
                    {blockedUsers.some(
                      (b) =>
                        b.blocker === myEmail && b.blocked === contextMenu.item,
                    )
                      ? "Разблокировать"
                      : "Заблокировать"}
                  </button>
                )}
                {myEmail === ADMIN_EMAIL && (
                  <>
                    <div className="h-px w-full bg-gray-200/50 dark:bg-gray-800/50 my-1.5" />
                    <button
                      onClick={() => {
                        deleteChat(contextMenu.item as string);
                        setContextMenu(null);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs font-bold transition text-red-500"
                    >
                      <Trash2 className="w-4 h-4" /> Удалить чат
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div
            className={`${!activeChat ? "hidden sm:flex" : "flex"} flex-1 bg-[#f4f4f5] dark:bg-[url('/chat-bg-dark.png')] dark:bg-black relative flex-col overflow-hidden`}
          >
            {activeChat ? (
              <div className="flex flex-col h-full bg-[#f4f4f5] dark:bg-black/90">
                <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#111] border-b border-gray-100 dark:border-gray-800 shrink-0 z-10 shadow-sm">
                  <button
                    onClick={() => window.history.back()}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition sm:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <Link
                    href={`/profile/${encodeURIComponent(activeChat)}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition"
                  >
                    <img
                      src={activeTargetAvatar}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-800 pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                        {activeTargetName}
                        {activeChat === ADMIN_EMAIL && (
                          <span
                            title="Администратор"
                            className="flex items-center shrink-0"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                          </span>
                        )}
                      </h3>
                      <p
                        className={`text-[10px] font-medium truncate ${statusText === "В сети" ? "text-blue-500 font-bold" : "text-gray-400"}`}
                      >
                        {statusText}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleMute(activeChat)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                      title={isMutedActive ? "Включить звук" : "Отключить звук"}
                    >
                      {isMutedActive ? (
                        <BellOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Bell className="w-4 h-4 text-blue-500" />
                      )}
                    </button>

                    {activeChat !== ADMIN_EMAIL && (
                      <button
                        onClick={() => toggleBlock(activeChat)}
                        className={`p-2 rounded-full transition ${amIBlockingActive ? "bg-red-100 dark:bg-red-900/40 text-red-500" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"}`}
                        title={
                          amIBlockingActive ? "Разблокировать" : "Заблокировать"
                        }
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={handleCloseModal}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition hidden sm:block"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 🔴 MESSAGES AREA WITH SWIPE-TO-REPLY */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 overflow-x-hidden no-scrollbar">
                  {activeChatMsgs.length === 0 && (
                    <p className="text-center text-xs text-gray-400 mt-10 bg-black/5 dark:bg-white/5 mx-auto w-fit px-4 py-1.5 rounded-full backdrop-blur-md">
                      Напишите первое сообщение...
                    </p>
                  )}
                  {activeChatMsgs.map((msg) => {
                    const isMe =
                      isAdmin && currentSpyEmail
                        ? msg.sender_email === currentSpyEmail
                        : msg.sender_email === myEmail;
                    const repliedMsg = msg.reply_to_id
                      ? messages.find((m) => m.id === msg.reply_to_id)
                      : null;

                    return (
                      <div
                        key={msg.id}
                        className={`relative w-full flex py-0.5 overflow-visible ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        {/* Swipe indicator */}
                        {swipingId === msg.id && (
                          <div
                            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity z-0"
                            style={{
                              opacity: Math.min(1, Math.abs(swipeOffset) / 50),
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                              <Reply className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                        )}

                        {/* Desktop hover reply button for them */}
                        {!isMe && (
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition hidden sm:block text-gray-500 shrink-0"
                          >
                            <Reply className="w-4 h-4" />
                          </button>
                        )}

                        {/* 🔴 SWIPE CONTAINER (Universal) */}
                        <div
                          onPointerDown={(e) => handlePointerDown(e, msg)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={(e) => handlePointerUp(e, msg)}
                          onPointerCancel={(e) => handlePointerUp(e, msg)}
                          className={`flex flex-col relative max-w-[85%] sm:max-w-[75%] z-10 cursor-grab active:cursor-grabbing ${isMe ? "items-end" : "items-start"}`}
                          style={{
                            transform:
                              swipingId === msg.id
                                ? `translateX(${swipeOffset}px)`
                                : "translateX(0px)",
                            transition:
                              swipingId === msg.id
                                ? "none"
                                : "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
                            touchAction: "pan-y",
                          }}
                        >
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-[14px] break-words leading-relaxed shadow-sm ${
                              isMe
                                ? "bg-blue-600 text-white rounded-br-sm"
                                : "bg-white dark:bg-[#222] border border-gray-100 dark:border-gray-800 text-black dark:text-white rounded-bl-sm"
                            }`}
                          >
                            {repliedMsg && (
                              <div
                                className={`mb-1.5 p-2 rounded-xl border-l-2 text-xs opacity-90 ${
                                  isMe
                                    ? "bg-blue-700/50 border-white text-white"
                                    : "bg-black/5 dark:bg-white/5 border-blue-500 text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                <p className="font-bold text-[10px] mb-0.5">
                                  {repliedMsg.sender_email === myEmail
                                    ? "Вы"
                                    : activeTargetName}
                                </p>
                                <p className="truncate opacity-90">
                                  {repliedMsg.content}
                                </p>
                              </div>
                            )}
                            {msg.content}
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 mx-1">
                            <span className="text-[9px] text-gray-400 font-mono">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMe && (
                              <span className="text-xs">
                                {msg.is_read ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-gray-400 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Desktop hover reply button for me */}
                        {isMe && (
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition hidden sm:block text-gray-500 shrink-0"
                          >
                            <Reply className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {replyingTo && (
                  <div className="px-4 py-2.5 bg-white dark:bg-[#161616] border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs shrink-0 shadow-lg z-20 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 truncate">
                      <Reply className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-blue-500 text-[10px] uppercase tracking-wider mb-0.5">
                          Ответ
                        </span>
                        <span className="truncate text-gray-600 dark:text-gray-300">
                          {replyingTo.content}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="p-3 bg-white dark:bg-[#111] border-t border-gray-100 dark:border-gray-800 relative shrink-0 z-20">
                  {isAdmin && currentSpyEmail ? (
                    <div className="text-center py-2 bg-emerald-500/10 text-emerald-500 rounded-2xl text-xs font-bold border border-emerald-500/20">
                      Режим просмотра (Spy Mode) — отправка отключена
                    </div>
                  ) : isBlockedByThemActive ? (
                    <div className="text-center py-3.5 bg-gray-100 dark:bg-[#222] rounded-2xl text-xs text-gray-500 font-bold border border-gray-200 dark:border-gray-800 shadow-sm">
                      Этот пользователь заблокировал вас.
                    </div>
                  ) : amIBlockingActive ? (
                    <button
                      onClick={() => toggleBlock(activeChat)}
                      className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-bold transition active:scale-95 shadow-sm"
                    >
                      Разблокировать пользователя
                    </button>
                  ) : (
                    <>
                      {showStickers && (
                        <div className="absolute bottom-full mb-2 left-0 w-full bg-white dark:bg-[#111] border-t border-gray-100 dark:border-gray-800 p-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-20 animate-in slide-in-from-bottom-2 h-48 overflow-y-auto no-scrollbar rounded-t-2xl">
                          <div className="grid grid-cols-7 sm:grid-cols-10 gap-y-3 gap-x-1 justify-items-center">
                            {EMOJIS.map((st) => (
                              <button
                                type="button"
                                key={st}
                                onClick={() => setInput((prev) => prev + st)}
                                className="text-2xl hover:scale-125 transition-transform hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-lg"
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <form
                        onSubmit={handleSend}
                        className="flex items-end gap-2"
                      >
                        <div className="flex-1 bg-gray-100 dark:bg-[#222] rounded-3xl flex items-center min-h-[44px] px-2 shadow-inner border border-transparent focus-within:border-blue-500/30 transition-colors">
                          <button
                            type="button"
                            onClick={() => setShowStickers(!showStickers)}
                            className={`p-2 transition shrink-0 ${showStickers ? "text-blue-500" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
                          >
                            <Smile className="w-5 h-5" />
                          </button>
                          <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Сообщение..."
                            disabled={isBanned || isSending}
                            className="flex-1 bg-transparent border-none focus:ring-0 px-2 py-3 text-sm focus:outline-none text-black dark:text-white disabled:opacity-50"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!input.trim() || isSending || isBanned}
                          className="w-[44px] h-[44px] rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 transition disabled:opacity-50 shadow-md active:scale-95"
                        >
                          {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 ml-0.5" />
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3 relative">
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-300">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium">Выберите чат для общения</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔴 Floating Chat Ikonkasi */}
      {isHomePage && (
        <div
          onClick={() => {
            if (!isOpenRef.current) {
              window.history.pushState({ chatStep: "list" }, "");
              setIsOpen(true);
            }
          }}
          className={`p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full shadow-2xl cursor-pointer hover:scale-110 transition-all pointer-events-auto relative active:scale-95 ${isOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"}`}
        >
          <div className="bg-blue-600 hover:bg-blue-500 p-3.5 sm:p-4 rounded-full text-white shadow-inner transition-colors">
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
          </div>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-bounce border-2 border-white dark:border-black shadow-md">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
