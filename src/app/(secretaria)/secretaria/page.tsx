"use client";

import { useMemo } from "react";
import { Building2 } from "lucide-react";
import { useAppStore } from "@/context/app-store";
import { PainelSecretariaClient } from "./painel-secretaria-client";

export default function SecretariaDashboardPage() {
  const { db } = useAppStore();

  const listaEscolas = useMemo(
    () =>
      [...db.escolas]
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((e) => ({ id: e.id, nome: e.nome })),
    [db.escolas]
  );

  const listaFornecedores = useMemo(
    () =>
      [...db.fornecedores]
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((f) => ({ id: f.id, nome: f.nome })),
    [db.fornecedores]
  );

  const pedidosCompletos = useMemo(() => {
    const pedidosOrdenados = [...db.pedidos].sort(
      (a, b) =>
        new Date(b.dataSolicitacao).getTime() -
        new Date(a.dataSolicitacao).getTime()
    );

    return pedidosOrdenados.map((ped) => {
      const escola = db.escolas.find((e) => e.id === ped.idEscola);
      const solicitante = db.perfisUsuarios.find(
        (u) => u.idAuth === ped.idUsuarioSolicitante
      );

      const itens = db.pedidoItens
        .filter((it) => it.idPedido === ped.id)
        .map((it) => {
          const prod = db.produtos.find((p) => p.id === it.idProduto);
          const forn = it.idFornecedor
            ? db.fornecedores.find((f) => f.id === it.idFornecedor)
            : undefined;

          return {
            idProduto: it.idProduto,
            nomeProduto: prod?.nome || `Produto #${it.idProduto}`,
            categoria: prod?.categoria || "outros",
            unidade: prod?.unidade || "un",
            quantidade: it.quantidade,
            precoUnitario: it.precoUnitario,
            idFornecedor: it.idFornecedor,
            nomeFornecedor: forn?.nome ?? null,
          };
        });

      const historico = db.pedidoHistoricoStatus
        .filter((h) => h.idPedido === ped.id)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .map((h) => ({
          status: h.status,
          observacao: h.observacao,
          data: h.data,
        }));

      const valorTotal = itens.reduce(
        (acc, item) => acc + Number(item.precoUnitario) * item.quantidade,
        0
      );

      return {
        id: ped.id,
        idEscola: ped.idEscola,
        nomeEscola: escola?.nome || `Escola #${ped.idEscola}`,
        nomeSolicitante: solicitante?.nome || "Usuário",
        status: ped.status,
        dataSolicitacao: ped.dataSolicitacao,
        dataPrevistaEntrega: ped.dataPrevistaEntrega,
        dataEntrega: ped.dataEntrega,
        observacao: ped.observacao,
        motivoCancelamento: ped.motivoCancelamento,
        itens,
        historico,
        valorTotal,
      };
    });
  }, [db]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-emerald-600" />
            <span>Painel da Secretaria de Educação</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestão centralizada de pedidos, análise, tramitação e relatórios
            para a rede escolar
          </p>
        </div>
      </div>

      <PainelSecretariaClient
        pedidosIniciais={pedidosCompletos}
        escolas={listaEscolas}
        fornecedores={listaFornecedores}
      />
    </div>
  );
}
