import { requireRole } from "@/lib/auth";
import { db } from "@/db/client";
import { produtos, estoqueLotes, escolas } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { EstoqueEscolaClient } from "./estoque-escola-client";
import { Boxes } from "lucide-react";

export default async function EstoqueEscolaPage() {
  const session = await requireRole(["escola", "administrador"]);
  const idEscola = session.idEscola || 1;

  // Buscar produtos e lotes da escola
  const lotesRaw = await db
    .select({
      idLote: estoqueLotes.id,
      idProduto: produtos.id,
      nomeProduto: produtos.nome,
      categoria: produtos.categoria,
      unidade: produtos.unidade,
      estoqueMinimo: produtos.estoqueMinimo,
      validade: estoqueLotes.validade,
      quantidadeAtual: estoqueLotes.quantidadeAtual,
    })
    .from(estoqueLotes)
    .innerJoin(produtos, eq(estoqueLotes.idProduto, produtos.id))
    .where(eq(estoqueLotes.idEscola, idEscola))
    .orderBy(produtos.categoria, produtos.nome, estoqueLotes.validade);

  // Também consultar produtos cadastrados para mostrar saldo mesmo que não tenha lote
  const todosProdutos = await db
    .select({
      id: produtos.id,
      nome: produtos.nome,
      categoria: produtos.categoria,
      unidade: produtos.unidade,
      estoqueMinimo: produtos.estoqueMinimo,
    })
    .from(produtos)
    .orderBy(produtos.categoria, produtos.nome);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-emerald-600" />
            <span>Estoque Físico da Unidade</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {session.nomeEscola ? (
              <span>Unidade: <strong className="text-slate-900">{session.nomeEscola}</strong></span>
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
