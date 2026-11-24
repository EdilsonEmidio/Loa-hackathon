"use client";

import { useMemo } from "react";
import { Boxes } from "lucide-react";
import { useAppStore } from "@/context/app-store";
import { EstoqueSecretariaClient } from "./estoque-secretaria-client";

export default function EstoqueSecretariaPage() {
  const { db } = useAppStore();

  const listaEscolas = useMemo(
    () =>
      [...db.escolas]
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((e) => ({ id: e.id, nome: e.nome })),
    [db.escolas]
  );

  const lotesRaw = useMemo(() => {
    return db.estoqueLotes
      .map((l) => {
        const escola = db.escolas.find((e) => e.id === l.idEscola);
        const prod = db.produtos.find((p) => p.id === l.idProduto);

        return {
          idLote: l.id,
          idEscola: l.idEscola,
          nomeEscola: escola?.nome || `Escola #${l.idEscola}`,
          idProduto: l.idProduto,
          nomeProduto: prod?.nome || `Produto #${l.idProduto}`,
          categoria: prod?.categoria || "outros",
          unidade: prod?.unidade || "un",
          estoqueMinimo: prod?.estoqueMinimo ?? 10,
          validade: l.validade,
          quantidadeAtual: l.quantidadeAtual,
        };
      })
      .sort((a, b) => {
        const esc = a.nomeEscola.localeCompare(b.nomeEscola);
        if (esc !== 0) return esc;
        const cat = a.categoria.localeCompare(b.categoria);
        if (cat !== 0) return cat;
        return a.nomeProduto.localeCompare(b.nomeProduto);
      });
  }, [db.estoqueLotes, db.escolas, db.produtos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-emerald-600" />
            <span>Controle Central de Estoques Escolares</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Supervisão e auditoria de saldos, prazos de validade e baixas em
            todas as unidades da rede
          </p>
        </div>
      </div>

      <EstoqueSecretariaClient
        escolas={listaEscolas}
        lotesIniciais={lotesRaw}
      />
    </div>
  );
}
