import { requireRole } from "@/lib/auth";
import { db } from "@/db/client";
import { produtos, estoqueLotes, escolas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EstoqueSecretariaClient } from "./estoque-secretaria-client";
import { Boxes } from "lucide-react";

export default async function EstoqueSecretariaPage() {
  await requireRole(["secretaria", "administrador"]);

  // 1. Lista de Escolas
  const listaEscolas = await db
    .select({ id: escolas.id, nome: escolas.nome })
    .from(escolas)
    .orderBy(escolas.nome);

  // 2. Todos os lotes de todas as escolas
  const lotesRaw = await db
    .select({
      idLote: estoqueLotes.id,
      idEscola: estoqueLotes.idEscola,
      nomeEscola: escolas.nome,
      idProduto: produtos.id,
      nomeProduto: produtos.nome,
      categoria: produtos.categoria,
      unidade: produtos.unidade,
      estoqueMinimo: produtos.estoqueMinimo,
      validade: estoqueLotes.validade,
      quantidadeAtual: estoqueLotes.quantidadeAtual,
    })
    .from(estoqueLotes)
    .innerJoin(escolas, eq(estoqueLotes.idEscola, escolas.id))
    .innerJoin(produtos, eq(estoqueLotes.idProduto, produtos.id))
    .orderBy(escolas.nome, produtos.categoria, produtos.nome);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-emerald-600" />
            <span>Controle Central de Estoques Escolares</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Supervisão e auditoria de saldos, prazos de validade e baixas em todas as unidades da rede
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
