"use client";

import { useMemo } from "react";
import { Boxes } from "lucide-react";
import { useAppStore } from "@/context/app-store";
import { EstoqueEscolaClient } from "./estoque-escola-client";

export default function EstoqueEscolaPage() {
  const { db, session } = useAppStore();
  const idEscola = session?.idEscola || 1;

  const lotesRaw = useMemo(() => {
    return db.estoqueLotes
      .filter((l) => l.idEscola === idEscola)
      .map((l) => {
        const prod = db.produtos.find((p) => p.id === l.idProduto);
        return {
          idLote: l.id,
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
        const cat = a.categoria.localeCompare(b.categoria);
        if (cat !== 0) return cat;
        const nome = a.nomeProduto.localeCompare(b.nomeProduto);
        if (nome !== 0) return nome;
        return (a.validade || "9999-99-99").localeCompare(
          b.validade || "9999-99-99"
        );
      });
  }, [db.estoqueLotes, db.produtos, idEscola]);

  const todosProdutos = useMemo(() => {
    return [...db.produtos]
      .sort((a, b) => {
        const cat = a.categoria.localeCompare(b.categoria);
        if (cat !== 0) return cat;
        return a.nome.localeCompare(b.nome);
      })
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        categoria: p.categoria,
        unidade: p.unidade,
        estoqueMinimo: p.estoqueMinimo,
      }));
  }, [db.produtos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-emerald-600" />
            <span>Estoque Físico da Unidade</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {session?.nomeEscola ? (
              <span>
                Unidade:{" "}
                <strong className="text-slate-900">{session.nomeEscola}</strong>
              </span>
            ) : (
              "Controle de saldos por lote e validade"
            )}
          </p>
        </div>
      </div>

      <EstoqueEscolaClient
        lotes={lotesRaw}
        produtosCatalogo={todosProdutos}
      />
    </div>
  );
}
