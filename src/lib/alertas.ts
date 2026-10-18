import { db } from "@/db/client";
import { produtos, estoqueLotes, escolas } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export interface AlertaItem {
  tipo: "estoque_baixo" | "validade_proxima";
  idEscola: number;
  nomeEscola: string;
  idProduto: number;
  nomeProduto: string;
  detalhe: string;
  quantidadeAtual: number;
  estoqueMinimo?: number;
  validade?: string | null;
}

export async function buscarAlertas(idEscolaFiltro?: number | null): Promise<AlertaItem[]> {
  const alertas: AlertaItem[] = [];

  // 1. Alerta de Estoque Baixo: soma da quantidade de cada produto por escola <= estoqueMinimo
  // Agrupando por escola e produto
  const saldosPorProduto = await db
    .select({
      idEscola: escolas.id,
      nomeEscola: escolas.nome,
      idProduto: produtos.id,
      nomeProduto: produtos.nome,
      estoqueMinimo: produtos.estoqueMinimo,
      quantidadeTotal: sql<number>`COALESCE(SUM(${estoqueLotes.quantidadeAtual}), 0)::int`,
    })
    .from(produtos)
    .crossJoin(escolas)
    .leftJoin(
      estoqueLotes,
      sql`${estoqueLotes.idProduto} = ${produtos.id} AND ${estoqueLotes.idEscola} = ${escolas.id}`
    )
    .where(idEscolaFiltro ? eq(escolas.id, idEscolaFiltro) : sql`true`)
    .groupBy(escolas.id, escolas.nome, produtos.id, produtos.nome, produtos.estoqueMinimo);

  for (const item of saldosPorProduto) {
    if (item.quantidadeTotal <= item.estoqueMinimo) {
      alertas.push({
        tipo: "estoque_baixo",
        idEscola: item.idEscola,
        nomeEscola: item.nomeEscola,
        idProduto: item.idProduto,
        nomeProduto: item.nomeProduto,
        quantidadeAtual: item.quantidadeTotal,
        estoqueMinimo: item.estoqueMinimo,
        detalhe: `Estoque crítico: ${item.quantidadeTotal} em estoque (mínimo: ${item.estoqueMinimo})`,
      });
    }
  }

  // 2. Alerta de Validade Próxima: lotes com validade até hoje + 14 dias e quantidade > 0
  const lotesVencendo = await db
    .select({
      idEscola: estoqueLotes.idEscola,
      nomeEscola: escolas.nome,
      idProduto: produtos.id,
      nomeProduto: produtos.nome,
      validade: estoqueLotes.validade,
      quantidadeAtual: estoqueLotes.quantidadeAtual,
    })
    .from(estoqueLotes)
    .innerJoin(escolas, eq(estoqueLotes.idEscola, escolas.id))
    .innerJoin(produtos, eq(estoqueLotes.idProduto, produtos.id))
    .where(
      sql`${estoqueLotes.quantidadeAtual} > 0 
          AND ${estoqueLotes.validade} IS NOT NULL 
          AND ${estoqueLotes.validade} <= CURRENT_DATE + INTERVAL '14 days'
          ${idEscolaFiltro ? sql`AND ${estoqueLotes.idEscola} = ${idEscolaFiltro}` : sql``}`
    );

  for (const lote of lotesVencendo) {
    alertas.push({
      tipo: "validade_proxima",
      idEscola: lote.idEscola,
      nomeEscola: lote.nomeEscola,
      idProduto: lote.idProduto,
      nomeProduto: lote.nomeProduto,
      quantidadeAtual: lote.quantidadeAtual,
      validade: lote.validade,
      detalhe: `Vencimento próximo em ${lote.validade} (${lote.quantidadeAtual} unidades)`,
    });
  }

  return alertas;
}
