"use server";

import { db, pool } from "@/db/client";
import {
  pedidos,
  pedidoItens,
  pedidoHistoricoStatus,
  produtos,
  estoqueLotes,
  movimentacoesEstoque,
} from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ItemPedidoInput {
  idProduto: number;
  quantidade: number;
}

export async function criarPedidoAction(
  itens: ItemPedidoInput[],
  observacao?: string
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Não autenticado");
  }

  if (session.papel !== "escola" && session.papel !== "administrador") {
    throw new Error("Apenas escolas ou administradores podem emitir novos pedidos.");
  }

  const idEscola = session.idEscola || 1; // Padrão se for admin

  if (!itens || itens.length === 0) {
    throw new Error("O pedido precisa conter ao menos um item.");
  }

  // Buscar preços atuais dos produtos para snapshot
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Inserir pedido
    const insertPedidoRes = await client.query(
      `INSERT INTO secretaria_educacao.pedido (id_escola, id_usuario_solicitante, status, observacao)
       VALUES ($1, $2, 'em_analise', $3)
       RETURNING id`,
      [idEscola, session.idAuth, observacao || null]
    );
    const idPedido = insertPedidoRes.rows[0].id;

    // 2. Inserir itens com preço snapshot
    for (const item of itens) {
      if (item.quantidade <= 0) continue;

      const prodRes = await client.query(
        `SELECT preco FROM secretaria_educacao.produto WHERE id = $1`,
        [item.idProduto]
      );
      if (prodRes.rows.length === 0) continue;
      const precoUnitario = prodRes.rows[0].preco;

      await client.query(
        `INSERT INTO secretaria_educacao.pedido_item (id_pedido, id_produto, quantidade, preco_unitario)
         VALUES ($1, $2, $3, $4)`,
        [idPedido, item.idProduto, item.quantidade, precoUnitario]
      );
    }

    // 3. Registrar Histórico
    await client.query(
      `INSERT INTO secretaria_educacao.pedido_historico_status (id_pedido, status, id_usuario, observacao)
       VALUES ($1, 'em_analise', $2, 'Pedido criado e submetido para análise')`,
      [idPedido, session.idAuth]
    );

    await client.query("COMMIT");

    revalidatePath("/escola");
    revalidatePath("/secretaria");
    return { success: true, idPedido };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar pedido:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function cancelarPedidoAction(idPedido: number, motivo: string) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  if (!motivo || motivo.trim().length === 0) {
    return { success: false, error: "O motivo do cancelamento é obrigatório." };
  }

  const [pedido] = await db
    .select()
    .from(pedidos)
    .where(eq(pedidos.id, idPedido));

  if (!pedido) {
    return { success: false, error: "Pedido não encontrado." };
  }

  if (pedido.status === "entregue") {
    return { success: false, error: "Pedidos já entregues não podem ser cancelados." };
  }

  if (pedido.status === "cancelado") {
    return { success: false, error: "Este pedido já foi cancelado." };
  }

  // Escola só pode cancelar se estiver em_analise
  if (session.papel === "escola") {
    if (pedido.idEscola !== session.idEscola) {
      return { success: false, error: "Você não tem permissão para cancelar pedidos de outra escola." };
    }
    if (pedido.status !== "em_analise") {
      return {
        success: false,
        error: "A escola só pode cancelar pedidos enquanto estiverem em análise.",
      };
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE secretaria_educacao.pedido 
       SET status = 'cancelado', motivo_cancelamento = $1 
       WHERE id = $2`,
      [motivo, idPedido]
    );

    await client.query(
      `INSERT INTO secretaria_educacao.pedido_historico_status (id_pedido, status, id_usuario, observacao)
       VALUES ($1, 'cancelado', $2, $3)`,
      [idPedido, session.idAuth, `Cancelado por ${session.nome}: ${motivo}`]
    );

    await client.query("COMMIT");

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

export async function confirmarPedidoAction(idPedido: number) {
  const session = await getSession();
  if (!session || (session.papel !== "secretaria" && session.papel !== "administrador")) {
    return { success: false, error: "Apenas a secretaria pode confirmar pedidos." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE secretaria_educacao.pedido 
       SET status = 'confirmado' 
       WHERE id = $1 AND status = 'em_analise'`,
      [idPedido]
    );

    await client.query(
      `INSERT INTO secretaria_educacao.pedido_historico_status (id_pedido, status, id_usuario, observacao)
       VALUES ($1, 'confirmado', $2, 'Pedido aprovado pela Secretaria de Educação')`,
      [idPedido, session.idAuth]
    );

    await client.query("COMMIT");

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

export async function iniciarPreparoAction(
  idPedido: number,
  dataPrevistaEntrega: string,
  fornecedorPorItem?: Record<number, number> // idProduto -> idFornecedor
) {
  const session = await getSession();
  if (!session || (session.papel !== "secretaria" && session.papel !== "administrador")) {
    return { success: false, error: "Apenas a secretaria pode iniciar preparo de pedidos." };
  }

  if (!dataPrevistaEntrega) {
    return { success: false, error: "A data prevista de entrega é obrigatória." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE secretaria_educacao.pedido 
       SET status = 'em_preparo', data_prevista_entrega = $1 
       WHERE id = $2`,
      [dataPrevistaEntrega, idPedido]
    );

    if (fornecedorPorItem) {
      for (const [idProduto, idFornecedor] of Object.entries(fornecedorPorItem)) {
        if (idFornecedor) {
          await client.query(
            `UPDATE secretaria_educacao.pedido_item 
             SET id_fornecedor = $1 
             WHERE id_pedido = $2 AND id_produto = $3`,
            [idFornecedor, idPedido, Number(idProduto)]
          );
        }
      }
    }

    await client.query(
      `INSERT INTO secretaria_educacao.pedido_historico_status (id_pedido, status, id_usuario, observacao)
       VALUES ($1, 'em_preparo', $2, $3)`,
      [
        idPedido,
        session.idAuth,
        `Entrou em preparo. Entrega estimada para ${dataPrevistaEntrega}`,
      ]
    );

    await client.query("COMMIT");

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

export async function marcarEntregueAction(
  idPedido: number,
  validadesPorItem: Record<number, string> // idProduto -> validade YYYY-MM-DD
) {
  const session = await getSession();
  if (!session || (session.papel !== "secretaria" && session.papel !== "administrador")) {
    return { success: false, error: "Apenas a secretaria pode confirmar entrega." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Buscar dados do pedido
    const pedidoRes = await client.query(
      `SELECT id_escola, status FROM secretaria_educacao.pedido WHERE id = $1`,
      [idPedido]
    );
    if (pedidoRes.rows.length === 0) throw new Error("Pedido não encontrado");
    const { id_escola, status } = pedidoRes.rows[0];

    if (status === "entregue") {
      throw new Error("Este pedido já foi marcado como entregue.");
    }

    // 1. Atualizar status para entregue
    await client.query(
      `UPDATE secretaria_educacao.pedido 
       SET status = 'entregue', data_entrega = NOW() 
       WHERE id = $1`,
      [idPedido]
    );

    // 2. Buscar itens do pedido
    const itensRes = await client.query(
      `SELECT id_produto, quantidade FROM secretaria_educacao.pedido_item WHERE id_pedido = $1`,
      [idPedido]
    );

    // 3. Criar lote de estoque e movimentação de entrada para cada item
    for (const item of itensRes.rows) {
      const validade = validadesPorItem[item.id_produto] || null;

      const loteRes = await client.query(
        `INSERT INTO secretaria_educacao.estoque_lote (id_escola, id_produto, id_pedido, validade, quantidade_atual)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [id_escola, item.id_produto, idPedido, validade, item.quantidade]
      );
      const idLote = loteRes.rows[0].id;

      await client.query(
        `INSERT INTO secretaria_educacao.movimentacao_estoque (id_estoque_lote, tipo, quantidade, motivo, id_usuario)
         VALUES ($1, 'entrada', $2, 'Recebimento de entrega do pedido #' || $3, $4)`,
        [idLote, item.quantidade, idPedido, session.idAuth]
      );
    }

    // 4. Gravar no histórico
    await client.query(
      `INSERT INTO secretaria_educacao.pedido_historico_status (id_pedido, status, id_usuario, observacao)
       VALUES ($1, 'entregue', $2, 'Produtos conferidos e incorporados ao estoque da escola')`,
      [idPedido, session.idAuth]
    );

    await client.query("COMMIT");

    revalidatePath("/escola");
    revalidatePath("/escola/estoque");
    revalidatePath("/secretaria");
    revalidatePath("/secretaria/estoque");
    return { success: true };
  } catch (error: any) {
    await client.query("ROLLBACK");
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}
