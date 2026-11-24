"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { useAppStore } from "@/context/app-store";
import { ListaPedidosEscolaClient } from "./pedidos-escola-client";

export default function EscolaDashboardPage() {
  const { db, session } = useAppStore();
  const idEscola = session?.idEscola || 1;

  const pedidosComItens = useMemo(() => {
    const pedidosRaw = db.pedidos
      .filter((p) => p.idEscola === idEscola)
      .sort(
        (a, b) =>
          new Date(b.dataSolicitacao).getTime() -
          new Date(a.dataSolicitacao).getTime()
      );

    return pedidosRaw.map((ped) => {
      const itens = db.pedidoItens
        .filter((it) => it.idPedido === ped.id)
        .map((it) => {
          const prod = db.produtos.find((p) => p.id === it.idProduto);
          return {
            idProduto: it.idProduto,
            nomeProduto: prod?.nome || `Produto #${it.idProduto}`,
            quantidade: it.quantidade,
            precoUnitario: it.precoUnitario,
            unidade: prod?.unidade || "un",
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
  }, [db, idEscola]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-600" />
            <span>Pedidos de Suprimentos da Escola</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {session?.nomeEscola ? (
              <span>
                Unidade:{" "}
                <strong className="text-slate-900">{session.nomeEscola}</strong>
              </span>
            ) : (
              "Acompanhe o andamento dos pedidos de materiais e alimentos"
            )}
          </p>
        </div>

        <Link
          href="/escola/pedidos/novo"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Fazer Novo Pedido</span>
        </Link>
      </div>

      {/* Lista com Filtros e Ações Client */}
      <ListaPedidosEscolaClient pedidosIniciais={pedidosComItens} />
    </div>
  );
}
