import { requireRole } from "@/lib/auth";
import { db } from "@/db/client";
import { escolas, perfisUsuarios, produtos, fornecedores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AdminPanelClient } from "./admin-panel-client";
import { ShieldCheck } from "lucide-react";

export default async function AdminPage() {
  await requireRole(["administrador"]);

  const [escolasLista, usuariosLista, produtosLista, fornecedoresLista] =
    await Promise.all([
      db.select().from(escolas).orderBy(escolas.nome),
      db
        .select({
          idAuth: perfisUsuarios.idAuth,
          nome: perfisUsuarios.nome,
          email: perfisUsuarios.email,
          papel: perfisUsuarios.papel,
          idEscola: perfisUsuarios.idEscola,
          nomeEscola: escolas.nome,
        })
        .from(perfisUsuarios)
        .leftJoin(escolas, eq(perfisUsuarios.idEscola, escolas.id))
        .orderBy(perfisUsuarios.nome),
      db.select().from(produtos).orderBy(produtos.categoria, produtos.nome),
      db.select().from(fornecedores).orderBy(fornecedores.nome),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-purple-600" />
            <span>Painel de Administração do Sistema</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestão cadastral de unidades escolares, operadores, catálogo de produtos e fornecedores
          </p>
        </div>
      </div>

      <AdminPanelClient
        escolas={escolasLista}
        usuarios={usuariosLista}
        produtos={produtosLista}
        fornecedores={fornecedoresLista}
      />
    </div>
  );
}
