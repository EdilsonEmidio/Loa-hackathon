import { requireRole } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { buscarAlertas } from "@/lib/alertas";
import { db } from "@/db/client";
import { escolas } from "@/db/schema";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["administrador"]);
  const alertas = await buscarAlertas(null);
  const escolasLista = await db.select({ id: escolas.id, nome: escolas.nome }).from(escolas);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar session={session} alertas={alertas} escolasLista={escolasLista} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
