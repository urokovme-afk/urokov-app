"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  User,
  MapPin,
  Laptop,
} from "lucide-react";

interface LiveSession {
  user_email: string;
  pathname: string;
  ip_address: string;
  device_info: string;
  last_seen: string;
}

export default function RadarPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from("live_sessions")
        .select("*")
        .order("last_seen", { ascending: false });

      if (isMounted) {
        if (data) {
          setSessions(data);
        }
        if (error) {
          console.error("Ошибка загрузки:", error.message);
        }
        // Baza bo'sh bo'lsa ham, xato bo'lsa ham loadingni to'xtatamiz
        setLoading(false);
      }
    };

    fetchSessions();

    // BAZANI REAL VAQTDA (JONLI) ESHITISH
    const channel = supabase
      .channel("radar_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_sessions" },
        (payload) => {
          if (!isMounted) return;

          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const newSession = payload.new as LiveSession;
            setSessions((prev) => {
              const exists = prev.find(
                (s) => s.user_email === newSession.user_email,
              );
              if (exists) {
                // Yangilash va eng tepaga olib chiqish
                return [
                  newSession,
                  ...prev.filter((s) => s.user_email !== newSession.user_email),
                ];
              }
              return [newSession, ...prev];
            });
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Onlayn holatini tekshirish (oxirgi 1 daqiqa ichida faol bo'lsa "Onlayn" deymiz)
  const isOnline = (lastSeenISO: string) => {
    const lastSeen = new Date(lastSeenISO).getTime();
    const now = new Date().getTime();
    const diffInSeconds = (now - lastSeen) / 1000;
    return diffInSeconds < 60; // 60 soniyadan kam bo'lsa jonli
  };

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Только что";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} мин назад`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} час назад`;
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (device: string) => {
    if (device.includes("Android") || device.includes("iOS"))
      return <Smartphone className="w-4 h-4 text-blue-400" />;
    if (
      device.includes("Mac") ||
      device.includes("Windows") ||
      device.includes("Linux")
    )
      return <Laptop className="w-4 h-4 text-emerald-400" />;
    return <Monitor className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-6 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 bg-[#111] hover:bg-[#222] rounded-xl border border-gray-800 transition active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                Радар Активности
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Отслеживание сессий в реальном времени
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute" />
            <div className="w-2 h-2 rounded-full bg-emerald-500 relative" />
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest ml-1">
              ОНЛАЙН
            </span>
          </div>
        </div>

        {/* RADAR CONTENT */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute w-full h-full border-2 border-emerald-500/20 rounded-full animate-ping" />
              <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-gray-500 py-20 text-sm border border-dashed border-gray-800 rounded-3xl">
            Пока нет активных пользователей в сети.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sessions.map((session) => {
              const online = isOnline(session.last_seen);
              return (
                <div
                  key={session.user_email}
                  className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    online
                      ? "bg-[#111] border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                      : "bg-[#0f0f0f] border-gray-800/80 opacity-70"
                  }`}
                >
                  {/* Holat indikatori */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center border border-gray-800 shrink-0">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-200 truncate">
                          {session.user_email}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                          {online ? (
                            <span className="text-emerald-500 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />{" "}
                              В сети
                            </span>
                          ) : (
                            <span className="text-gray-500 flex items-center gap-1">
                              Офлайн
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap bg-black px-2 py-1 rounded-md border border-gray-800">
                      {formatRelativeTime(session.last_seen)}
                    </span>
                  </div>

                  <div className="space-y-2 mt-4 pt-4 border-t border-gray-800/50">
                    <div className="flex items-start gap-2 text-xs">
                      <Globe className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px]">
                          Текущая страница
                        </span>
                        <span className="font-mono text-blue-400 break-all">
                          {session.pathname || "/"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px]">
                          IP Адрес
                        </span>
                        <span className="font-mono text-gray-300">
                          {session.ip_address}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs">
                      {getDeviceIcon(session.device_info)}
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px]">
                          Устройство
                        </span>
                        <span className="text-gray-300">
                          {session.device_info}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
