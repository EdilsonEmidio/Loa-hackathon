import type { AlertaItem, AppDatabase } from "./types";

export type { AlertaItem };

export function isValidadeProxima(validadeStr: string | null): boolean {
  if (!validadeStr) return false;
  const dataVal = new Date(validadeStr + "T00:00:00");
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diffDias = Math.ceil((dataVal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  return diffDias <= 14;
}

/**
 * Calcula alertas de estoque baixo e validade próxima diretamente a partir do estado local.
 */
export function calcularAlertas(
  db: AppDatabase,
  idEscolaFiltro?: number | null
): AlertaItem[] {
  const alertas: AlertaItem[] = [];

  const escolasAlvo = idEscolaFiltro
    ? db.escolas.filter((e) => e.id === idEscolaFiltro)
    : db.escolas;

  // 1. Alerta de Estoque Baixo: soma da quantidade de cada produto por escola <= estoqueMinimo
  for (const escola of escolasAlvo) {
    for (const produto of db.produtos) {
      const quantidadeTotal = db.estoqueLotes
        .filter((l) => l.idEscola === escola.id && l.idProduto === produto.id)
        .reduce((acc, l) => acc + l.quantidadeAtual, 0);

      if (quantidadeTotal <= produto.estoqueMinimo) {
        alertas.push({
          tipo: "estoque_baixo",
          idEscola: escola.id,
          nomeEscola: escola.nome,
          idProduto: produto.id,
          nomeProduto: produto.nome,
          quantidadeAtual: quantidadeTotal,
          estoqueMinimo: produto.estoqueMinimo,
          detalhe: `Estoque crítico: ${quantidadeTotal} em estoque (mínimo: ${produto.estoqueMinimo})`,
        });
      }
    }
  }

  // 2. Alerta de Validade Próxima: lotes com validade até hoje + 14 dias e quantidade > 0
  for (const lote of db.estoqueLotes) {
    if (lote.quantidadeAtual <= 0 || !lote.validade) continue;
    if (idEscolaFiltro && lote.idEscola !== idEscolaFiltro) continue;
    if (!isValidadeProxima(lote.validade)) continue;

    const escola = db.escolas.find((e) => e.id === lote.idEscola);
    const produto = db.produtos.find((p) => p.id === lote.idProduto);
    if (!escola || !produto) continue;

    alertas.push({
      tipo: "validade_proxima",
      idEscola: escola.id,
      nomeEscola: escola.nome,
      idProduto: produto.id,
      nomeProduto: produto.nome,
      quantidadeAtual: lote.quantidadeAtual,
      validade: lote.validade,
      detalhe: `Vencimento próximo em ${lote.validade} (${lote.quantidadeAtual} unidades)`,
    });
  }

  return alertas;
}
