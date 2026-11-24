"use client";

import { useMemo } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { useAppStore } from "@/context/app-store";
import { calcularAlertas } from "@/lib/alertas";
import type { PapelUsuario } from "@/lib/types";

const ALLOWED_ROLES: PapelUsuario[] = ["secretaria", "administrador"];

function SecretariaShell({ children }: { children: React.ReactNode }) {
  const { db, session } = useAppStore();

  const alertas = useMemo(() => calcularAlertas(db, null), [db]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar session={session} alertas={alertas} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default function SecretariaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={ALLOWED_ROLES}>
      <SecretariaShell>{children}</SecretariaShell>
    </AuthGuard>
  );
}
