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
        err instanceof Error ? err.message : "Avtorizatsiya paytida xatolik yuz berdi"
      );
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 flex flex-col gap-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Lock className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Boshqaruv Terminali
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">
              urokov.me@gmail.com
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-black font-semibold text-xs tracking-wide transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <LogIn className="w-4 h-4 text-black" />
            )}
            <span>Google orqali kirish</span>
          </button>

          <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
            Faqat tizim egasi uchun maxsus yopiq portal.
          </p>
        </div>
      </div>
    </div>
  );
}
