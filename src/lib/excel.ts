import type { AppDatabase, CategoriaProduto } from "./types";

export interface ProdutoImportadoInput {
  nome: string;
  categoria: CategoriaProduto;
  unidade: string;
  preco: number;
  estoqueMinimo: number;
  descricao?: string;
}

export async function importarProdutosExcel(file: File): Promise<{
  produtos: ProdutoImportadoInput[];
  erros: string[];
}> {
  const ExcelJS = (await import("exceljs")).default;
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("A planilha está vazia.");
  }

  const produtos: ProdutoImportadoInput[] = [];
  const erros: string[] = [];
  const categoriasValidas: CategoriaProduto[] = [
    "limpeza",
    "higiene",
    "alimento",
    "material",
    "outros",
  ];

  // Linha 1 = cabeçalho. Itera a partir da linha 2
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const nome = row.getCell(1).text?.trim();
    const categoriaRaw = row.getCell(2).text?.trim().toLowerCase();
    const unidade = row.getCell(3).text?.trim() || "un";
    const precoRaw = row.getCell(4).value;
    const estoqueMinimoRaw = row.getCell(5).value;
    const descricao = row.getCell(6).text?.trim() || undefined;

    if (!nome) continue;

    const categoria: CategoriaProduto = categoriasValidas.includes(
      categoriaRaw as CategoriaProduto
    )
      ? (categoriaRaw as CategoriaProduto)
      : "outros";

    const preco = Number(precoRaw) || 0;
    const estoqueMinimo = parseInt(String(estoqueMinimoRaw || "10"), 10) || 10;

    if (preco <= 0) {
      erros.push(`Linha ${rowNumber} (${nome}): preço inválido ou zerado.`);
      continue;
    }

    produtos.push({
      nome,
      categoria,
      unidade,
      preco,
      estoqueMinimo,
      descricao,
    });
  }

  return { produtos, erros };
}

export async function exportarRelatorioPedidosExcel(
  db: AppDatabase,
  statusFiltro: string,
  escolaFiltro: string
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;

  const pedidosFiltrados = db.pedidos
    .filter((p) => {
      const matchStatus =
        !statusFiltro || statusFiltro === "todos" || p.status === statusFiltro;
      const matchEscola =
        !escolaFiltro ||
        escolaFiltro === "todas" ||
        p.idEscola === Number(escolaFiltro);
      return matchStatus && matchEscola;
    })
    .sort(
      (a, b) =>
        new Date(b.dataSolicitacao).getTime() - new Date(a.dataSolicitacao).getTime()
    );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Secretaria de Educação";
  workbook.created = new Date();

  // 1. Aba Pedidos
  const sheetPedidos = workbook.addWorksheet("Pedidos");
  sheetPedidos.columns = [
    { header: "Nº Pedido", key: "id", width: 12 },
    { header: "Unidade Escolar", key: "escolaNome", width: 32 },
    { header: "Solicitante", key: "solicitanteNome", width: 25 },
    { header: "Status", key: "status", width: 16 },
    { header: "Data Solicitação", key: "dataSolicitacao", width: 20 },
    { header: "Previsão Entrega", key: "dataPrevistaEntrega", width: 18 },
    { header: "Data Entrega", key: "dataEntrega", width: 20 },
    { header: "Observações", key: "observacao", width: 35 },
    { header: "Motivo Cancelamento", key: "motivoCancelamento", width: 35 },
  ];

  sheetPedidos.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetPedidos.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  };

  for (const p of pedidosFiltrados) {
    const escola = db.escolas.find((e) => e.id === p.idEscola);
    const solicitante = db.perfisUsuarios.find(
      (u) => u.idAuth === p.idUsuarioSolicitante
    );

    sheetPedidos.addRow({
      id: `#${p.id.toString().padStart(4, "0")}`,
      escolaNome: escola?.nome || `Escola #${p.idEscola}`,
      solicitanteNome: solicitante?.nome || "Usuário",
      status: p.status.toUpperCase().replace("_", " "),
      dataSolicitacao: new Date(p.dataSolicitacao).toLocaleDateString("pt-BR"),
      dataPrevistaEntrega: p.dataPrevistaEntrega
        ? new Date(p.dataPrevistaEntrega + "T00:00:00").toLocaleDateString("pt-BR")
        : "-",
      dataEntrega: p.dataEntrega
        ? new Date(p.dataEntrega).toLocaleDateString("pt-BR")
        : "-",
      observacao: p.observacao || "-",
      motivoCancelamento: p.motivoCancelamento || "-",
    });
  }

  // 2. Aba Detalhes dos Itens
  const sheetItens = workbook.addWorksheet("Itens dos Pedidos");
  sheetItens.columns = [
    { header: "Nº Pedido", key: "idPedido", width: 12 },
    { header: "Produto", key: "nomeProduto", width: 35 },
    { header: "Categoria", key: "categoria", width: 16 },
    { header: "Quantidade", key: "quantidade", width: 14 },
    { header: "Unidade", key: "unidade", width: 12 },
    { header: "Preço Unitário (R$)", key: "precoUnitario", width: 20 },
    { header: "Subtotal (R$)", key: "subtotal", width: 18 },
  ];

  sheetItens.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetItens.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F766E" },
  };

  for (const ped of pedidosFiltrados) {
    const itens = db.pedidoItens.filter((it) => it.idPedido === ped.id);
    for (const it of itens) {
      const produto = db.produtos.find((pr) => pr.id === it.idProduto);
      if (!produto) continue;

      sheetItens.addRow({
        idPedido: `#${it.idPedido.toString().padStart(4, "0")}`,
        nomeProduto: produto.nome,
        categoria: produto.categoria.toUpperCase(),
        quantidade: it.quantidade,
        unidade: produto.unidade,
        precoUnitario: Number(it.precoUnitario).toFixed(2),
        subtotal: (Number(it.precoUnitario) * it.quantidade).toFixed(2),
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio_pedidos_educacao_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
