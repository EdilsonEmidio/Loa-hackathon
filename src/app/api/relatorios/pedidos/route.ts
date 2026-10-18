import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db/client";
import { pedidos, pedidoItens, produtos, escolas, perfisUsuarios } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.papel !== "secretaria" && session.papel !== "administrador")) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFiltro = searchParams.get("status");
  const escolaFiltro = searchParams.get("escola");

  // Buscar pedidos com dados das escolas e solicitantes
  const pedidosQuery = await db
    .select({
      id: pedidos.id,
      escolaNome: escolas.nome,
      solicitanteNome: perfisUsuarios.nome,
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
    .where(
      and(
        statusFiltro && statusFiltro !== "todos"
          ? eq(pedidos.status, statusFiltro as any)
          : sql`true`,
        escolaFiltro && escolaFiltro !== "todas"
          ? eq(pedidos.idEscola, Number(escolaFiltro))
          : sql`true`
      )
    )
    .orderBy(desc(pedidos.dataSolicitacao));

  // Criar Workbook Excel
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

  // Estilizar cabeçalho
  sheetPedidos.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetPedidos.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  };

  pedidosQuery.forEach((p) => {
    sheetPedidos.addRow({
      id: `#${p.id.toString().padStart(4, "0")}`,
      escolaNome: p.escolaNome,
      solicitanteNome: p.solicitanteNome,
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
  });

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

  for (const ped of pedidosQuery) {
    const itens = await db
      .select({
        idPedido: pedidoItens.idPedido,
        nomeProduto: produtos.nome,
        categoria: produtos.categoria,
        unidade: produtos.unidade,
        quantidade: pedidoItens.quantidade,
        precoUnitario: pedidoItens.precoUnitario,
      })
      .from(pedidoItens)
      .innerJoin(produtos, eq(pedidoItens.idProduto, produtos.id))
      .where(eq(pedidoItens.idPedido, ped.id));

    itens.forEach((it) => {
      sheetItens.addRow({
        idPedido: `#${it.idPedido.toString().padStart(4, "0")}`,
        nomeProduto: it.nomeProduto,
        categoria: it.categoria.toUpperCase(),
        quantidade: it.quantidade,
        unidade: it.unidade,
        precoUnitario: Number(it.precoUnitario).toFixed(2),
        subtotal: (Number(it.precoUnitario) * it.quantidade).toFixed(2),
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="relatorio_pedidos_educacao_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
