"use client";

import { useMemo } from "react";
import { useAppStore } from "@/context/app-store";
import { FormNovoPedidoClient } from "./novo-pedido-client";

export default function NovoPedidoPage() {
  const { db, session } = useAppStore();

  const catalogoProdutos = useMemo(() => {
    return [...db.produtos].sort((a, b) => {
      const catCompare = a.categoria.localeCompare(b.categoria);
      if (catCompare !== 0) return catCompare;
      return a.nome.localeCompare(b.nome);
    });
  }, [db.produtos]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FormNovoPedidoClient
        produtos={catalogoProdutos}
        nomeEscola={session?.nomeEscola || "Unidade Escolar"}
      />
    </div>
  );
}
