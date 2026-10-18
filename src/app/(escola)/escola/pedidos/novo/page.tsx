import { requireRole } from "@/lib/auth";
import { db } from "@/db/client";
import { produtos } from "@/db/schema";
import { FormNovoPedidoClient } from "./novo-pedido-client";

export default async function NovoPedidoPage() {
  const session = await requireRole(["escola", "administrador"]);

  const catalogoProdutos = await db
    .select({
      id: produtos.id,
      nome: produtos.nome,
      descricao: produtos.descricao,
      categoria: produtos.categoria,
      unidade: produtos.unidade,
      preco: produtos.preco,
      estoqueMinimo: produtos.estoqueMinimo,
    })
    .from(produtos)
    .orderBy(produtos.categoria, produtos.nome);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FormNovoPedidoClient
        produtos={catalogoProdutos}
        nomeEscola={session.nomeEscola || "Unidade Escolar"}
      />
    </div>
  );
}
