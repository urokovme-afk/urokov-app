"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

export function LiveTracker() {
  const pathname = usePathname();
  const ipRef = useRef<string>("Noma'lum IP");
  const actionRef = useRef<string>("Смотрит главную ленту");

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => {
        ipRef.current = data.ip;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;

    // URL manzilga qarab nima qilayotganini aniqlaymiz
    const updateActionFromPath = () => {
      if (!pathname || pathname === "/") return "Листает главную ленту";
      if (pathname.startsWith("/profile/")) {
        const target = decodeURIComponent(pathname.replace("/profile/", ""));
        return `Изучает профиль: ${target}`;
      }
      if (pathname === "/profile") return "Настраивает свой профиль";
      if (pathname.includes("/admin")) return "В панели администратора";
      if (pathname === "/login") return "Авторизуется в системе";
      return `На странице: ${pathname}`;
    };

    // Sahifa o'zgarganda holatni yangilaymiz
    actionRef.current = updateActionFromPath();

    const trackUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.email) return;

      const email = session.user.email.toLowerCase().trim();
      const ua = navigator.userAgent;

      let device = "Неизвестное устройство";
      if (/android/i.test(ua)) device = "Android (Смартфон)";
      else if (/iPad|iPhone|iPod/.test(ua)) device = "iOS (iPhone/iPad)";
      else if (/Mac OS/i.test(ua)) device = "Mac OS";
      else if (/Windows/i.test(ua)) device = "Windows PC";
      else if (/Linux/i.test(ua)) device = "Linux";

      if (isMounted) {
        await supabase.from("live_sessions").upsert({
          user_email: email,
          pathname: pathname,
          ip_address: ipRef.current,
          device_info: device,
          current_action: actionRef.current, // 🔴 Yangi: Nima ish qilayotgani
          last_seen: new Date().toISOString(),
        });
      }
    };

    trackUser();
    // Har 10 soniyada faollikni tasdiqlab turamiz
    const interval = setInterval(trackUser, 10000);

    // 🔴 Chat ochilganini ushlab olish
    const handleOpenChat = (e: Event) => {
      const target = (e as CustomEvent).detail;
      actionRef.current = `💬 В чате с: ${target}`;
      trackUser(); // Chat ochilganda bazaga zudlik bilan xabar beramiz
    };

    window.addEventListener("open-chat", handleOpenChat);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("open-chat", handleOpenChat);
    };
  }, [pathname]);

  return null;
}
