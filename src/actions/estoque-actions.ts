"use server";

import { pool } from "@/db/client";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface DarBaixaInput {
  idEstoqueLote: number;
  quantidade: number;
  tipo: "baixa_consumo" | "baixa_vencido" | "baixa_perda" | "ajuste";
  motivo?: string;
}

export async function darBaixaEstoqueAction(input: DarBaixaInput) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  if (input.quantidade <= 0) {
    return { success: false, error: "A quantidade para baixa deve ser maior que zero." };
  }

  // Escola só pode dar baixa por consumo
  if (session.papel === "escola" && input.tipo !== "baixa_consumo") {
    return { success: false, error: "A escola só pode registrar baixas por consumo." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Buscar lote com lock para evitar race condition
    const loteRes = await client.query(
      `SELECT id_escola, quantidade_atual 
       FROM secretaria_educacao.estoque_lote 
       WHERE id = $1 FOR UPDATE`,
      [input.idEstoqueLote]
    );

    if (loteRes.rows.length === 0) {
      throw new Error("Lote de estoque não encontrado.");
    }

    const { id_escola, quantidade_atual } = loteRes.rows[0];

    // Se for escola, só pode baixar lote da própria escola
    if (session.papel === "escola" && session.idEscola !== id_escola) {
      throw new Error("Você não tem autorização para dar baixa no estoque de outra unidade.");
    }

    if (quantidade_atual < input.quantidade) {
      throw new Error(
        `Saldo insuficiente no lote. Disponível: ${quantidade_atual}, solicitado: ${input.quantidade}`
      );
    }

    // Atualizar saldo
    await client.query(
      `UPDATE secretaria_educacao.estoque_lote 
       SET quantidade_atual = quantidade_atual - $1 
       WHERE id = $2`,
      [input.quantidade, input.idEstoqueLote]
    );

    // Gravar movimentação
    await client.query(
      `INSERT INTO secretaria_educacao.movimentacao_estoque 
       (id_estoque_lote, tipo, quantidade, motivo, id_usuario)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        input.idEstoqueLote,
        input.tipo,
        input.quantidade,
        input.motivo || `Baixa registrada por ${session.nome}`,
        session.idAuth,
      ]
    );

    await client.query("COMMIT");

    revalidatePath("/escola/estoque");
    revalidatePath("/secretaria/estoque");
    revalidatePath("/escola");
    revalidatePath("/secretaria");

    return { success: true };
  } catch (error: any) {
    await client.query("ROLLBACK");
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}
