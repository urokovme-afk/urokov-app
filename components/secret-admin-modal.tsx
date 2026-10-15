"use client";

import { useState } from "react";
import { X, Lock, LogIn, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

interface SecretAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SecretAdminModal({ isOpen, onClose }: SecretAdminModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      console.error("Auth error:", err);
      setErrorMsg(
        err instanceof Error ? err.message : "Ошибка при авторизации через Google"
      );
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-white border border-zinc-200 shadow-2xl p-6 flex flex-col gap-5">
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Заголовок */}
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800">
            <Lock className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 tracking-tight">
              Панель администратора
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">
              urokov.me@gmail.com
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold text-xs tracking-wide transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <LogIn className="w-4 h-4 text-white" />
            )}
            <span>Войти через Google</span>
          </button>

          <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
            Закрытый доступ только для автора.
          </p>
        </div>
      </div>
    </div>
  );
}
