"use client";

import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { useAppStore } from "@/context/app-store";
import { AdminPanelClient } from "./admin-panel-client";

export default function AdminPage() {
  const { db } = useAppStore();

  const escolasLista = useMemo(
    () => [...db.escolas].sort((a, b) => a.nome.localeCompare(b.nome)),
    [db.escolas]
  );

  const usuariosLista = useMemo(
    () =>
      [...db.perfisUsuarios]
        .map((u) => {
          const esc = u.idEscola
            ? db.escolas.find((e) => e.id === u.idEscola)
            : undefined;
          return {
            idAuth: u.idAuth,
            nome: u.nome,
            email: u.email,
            papel: u.papel,
            idEscola: u.idEscola,
            nomeEscola: esc?.nome ?? null,
          };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [db.perfisUsuarios, db.escolas]
  );

  const produtosLista = useMemo(
    () =>
      [...db.produtos].sort((a, b) => {
        const cat = a.categoria.localeCompare(b.categoria);
        if (cat !== 0) return cat;
        return a.nome.localeCompare(b.nome);
      }),
    [db.produtos]
  );

  const fornecedoresLista = useMemo(
    () => [...db.fornecedores].sort((a, b) => a.nome.localeCompare(b.nome)),
    [db.fornecedores]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-purple-600" />
            <span>Painel de Administração do Sistema</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestão cadastral de unidades escolares, operadores, catálogo de
            produtos e fornecedores
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
