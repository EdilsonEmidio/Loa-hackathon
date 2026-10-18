import { requireRole } from "@/lib/auth";
import { db } from "@/db/client";
import {
  pedidos,
  pedidoItens,
  produtos,
  escolas,
  fornecedores,
  pedidoHistoricoStatus,
  perfisUsuarios,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { PainelSecretariaClient } from "./painel-secretaria-client";
import { Building2 } from "lucide-react";

export default async function SecretariaDashboardPage() {
  await requireRole(["secretaria", "administrador"]);

  // 1. Escolas para os filtros
  const listaEscolas = await db
    .select({ id: escolas.id, nome: escolas.nome })
    .from(escolas)
    .orderBy(escolas.nome);

  // 2. Fornecedores disponíveis
  const listaFornecedores = await db
    .select({ id: fornecedores.id, nome: fornecedores.nome })
    .from(fornecedores)
    .orderBy(fornecedores.nome);

  // 3. Buscar todos os pedidos
  const pedidosRaw = await db
    .select({
      id: pedidos.id,
      idEscola: pedidos.idEscola,
      nomeEscola: escolas.nome,
      nomeSolicitante: perfisUsuarios.nome,
      status: pedidos.status,
      dataSolicitacao: pedidos.dataSolicitacao,
      dataPrevistaEntrega: pedidos.dataPrevistaEntrega,
      dataEntrega: pedidos.dataEntrega,
      observacao: pedidos.observacao,
      motivoCancelamento: pedidos.motivoCancelamento,
    })
    .from(pedidos)
    .innerJoin(escolas, eq(pedidos.idEscola, escolas.id))
    .innerJoin(perfisUsuarios, eq(pedidos.idUsuarioSolicitante, perfisUsuarios.idAuth))
    .orderBy(desc(pedidos.dataSolicitacao));

  // 4. Buscar itens e histórico de cada pedido
  const pedidosCompletos = await Promise.all(
    pedidosRaw.map(async (ped) => {
      const itens = await db
        .select({
          idProduto: pedidoItens.idProduto,
          nomeProduto: produtos.nome,
          categoria: produtos.categoria,
          unidade: produtos.unidade,
          quantidade: pedidoItens.quantidade,
          precoUnitario: pedidoItens.precoUnitario,
          idFornecedor: pedidoItens.idFornecedor,
          nomeFornecedor: fornecedores.nome,
        })
        .from(pedidoItens)
        .innerJoin(produtos, eq(pedidoItens.idProduto, produtos.id))
        .leftJoin(fornecedores, eq(pedidoItens.idFornecedor, fornecedores.id))
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-emerald-600" />
            <span>Painel da Secretaria de Educação</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestão centralizada de pedidos, análise, tramitação e relatórios para a rede escolar
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
