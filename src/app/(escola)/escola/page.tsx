import { requireRole } from "@/lib/auth";
import { db } from "@/db/client";
import { pedidos, pedidoItens, produtos, pedidoHistoricoStatus } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { ListaPedidosEscolaClient } from "./pedidos-escola-client";
import { Plus, Package } from "lucide-react";

export default async function EscolaDashboardPage() {
  const session = await requireRole(["escola", "administrador"]);
  const idEscola = session.idEscola || 1;

  // Buscar pedidos da escola
  const pedidosRaw = await db
    .select({
      id: pedidos.id,
      status: pedidos.status,
      dataSolicitacao: pedidos.dataSolicitacao,
      dataPrevistaEntrega: pedidos.dataPrevistaEntrega,
      dataEntrega: pedidos.dataEntrega,
      observacao: pedidos.observacao,
      motivoCancelamento: pedidos.motivoCancelamento,
    })
    .from(pedidos)
    .where(eq(pedidos.idEscola, idEscola))
    .orderBy(desc(pedidos.dataSolicitacao));

  // Buscar itens para cada pedido
  const pedidosComItens = await Promise.all(
    pedidosRaw.map(async (ped) => {
      const itens = await db
        .select({
          idProduto: pedidoItens.idProduto,
          nomeProduto: produtos.nome,
          quantidade: pedidoItens.quantidade,
          precoUnitario: pedidoItens.precoUnitario,
          unidade: produtos.unidade,
        })
        .from(pedidoItens)
        .innerJoin(produtos, eq(pedidoItens.idProduto, produtos.id))
        .where(eq(pedidoItens.idPedido, ped.id));

      const historico = await db
        .select({
          status: pedidoHistoricoStatus.status,
          observacao: pedidoHistoricoStatus.observacao,
          data: pedidoHistoricoStatus.data,
        })
        .from(pedidoHistoricoStatus)
        .where(eq(pedidoHistoricoStatus.idPedido, ped.id))
        .orderBy(desc(pedidoHistoricoStatus.data));

      const valorTotal = itens.reduce(
        (acc, item) => acc + Number(item.precoUnitario) * item.quantidade,
        0
      );

      return {
        ...ped,
        itens,
        historico,
        valorTotal,
      };
    })
  );

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
            {session.nomeEscola ? (
              <span>Unidade: <strong className="text-slate-900">{session.nomeEscola}</strong></span>
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
