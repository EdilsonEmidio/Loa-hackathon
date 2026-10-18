import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db/client";
import { produtos } from "@/db/schema";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.papel !== "secretaria" && session.papel !== "administrador")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("planilha") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ error: "A planilha está vazia." }, { status: 400 });
    }

    let importados = 0;
    const erros: string[] = [];

    // Linha 1 = cabeçalho. Itera a partir da linha 2
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const nome = row.getCell(1).text?.trim();
      const categoriaRaw = row.getCell(2).text?.trim().toLowerCase();
      const unidade = row.getCell(3).text?.trim() || "un";
      const precoRaw = row.getCell(4).value;
      const estoqueMinimoRaw = row.getCell(5).value;
      const descricao = row.getCell(6).text?.trim() || null;

      if (!nome) continue; // Linha em branco

      const categoriasValidas = ["limpeza", "higiene", "alimento", "material", "outros"];
      const categoria = categoriasValidas.includes(categoriaRaw)
        ? (categoriaRaw as any)
        : "outros";

      const preco = Number(precoRaw) || 0;
      const estoqueMinimo = parseInt(String(estoqueMinimoRaw || "10"), 10) || 10;

      try {
        await db.insert(produtos).values({
          nome,
          descricao,
          categoria,
          unidade,
          preco: preco.toFixed(2),
          estoqueMinimo,
        });
        importados++;
      } catch (err: any) {
        erros.push(`Linha ${rowNumber} (${nome}): ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      importados,
      erros,
    });
  } catch (error: any) {
    console.error("Erro ao importar planilha:", error);
    return NextResponse.json(
      { error: "Falha ao processar arquivo Excel: " + error.message },
      { status: 500 }
    );
  }
}
