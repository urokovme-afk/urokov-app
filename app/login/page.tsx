"use client";

import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { LogIn, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Foydalanuvchi Google'dan qaytib sessiya olganda log yozish
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email) {
        const userEmail = session.user.email.toLowerCase().trim();

        // Log yozish
        await supabase.from("activity_logs").insert([
          {
            user_email: userEmail,
            action: "Вход в систему",
            details: "Успешная авторизация через Google аккаунт",
          },
        ]);

        router.replace("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/login` },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white dark:bg-[#111] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
        <h1 className="text-2xl font-bold mb-2">Вход в систему</h1>
        <p className="text-gray-500 text-sm mb-8">
          Войдите, чтобы оставлять комментарии и реакции
        </p>

        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-2 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition cursor-pointer active:scale-95"
        >
          <LogIn className="w-5 h-5" />
          Продолжить с Google
        </button>

        <div className="mt-6">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-black dark:hover:text-white transition flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
