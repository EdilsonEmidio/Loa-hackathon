"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/context/app-store";

export default function HomePage() {
  const { session, isHydrated } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    if (!session) {
      router.replace("/login");
    } else if (session.papel === "administrador") {
      router.replace("/admin");
    } else if (session.papel === "secretaria") {
      router.replace("/secretaria");
    } else {
      router.replace("/escola");
    }
  }, [isHydrated, session, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">
          Redirecionando...
        </p>
      </div>
    </div>
  );
}
