"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-zinc-500 font-mono text-xs">
      Yo&apos;naltirilmoqda...
    </div>
  );
}
