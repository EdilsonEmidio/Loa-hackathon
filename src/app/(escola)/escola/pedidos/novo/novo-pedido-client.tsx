"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarPedidoAction } from "@/actions/pedido-actions";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: string;
  unidade: string;
  preco: string;
  estoqueMinimo: number;
}

export function FormNovoPedidoClient({
  produtos,
  nomeEscola,
}: {
  produtos: Produto[];
  nomeEscola: string;
}) {
  const router = useRouter();
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});
  const [observacao, setObservacao] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todas");
  const [busca, setBusca] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const categorias = ["todas", ...Array.from(new Set(produtos.map((p) => p.categoria)))];

  const handleUpdateQuantidade = (id: number, delta: number) => {
    setQuantidades((prev) => {
      const atual = prev[id] || 0;
      const novo = Math.max(0, atual + delta);
      if (novo === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: novo };
    });
  };

  const handleSetQuantidadeDireta = (id: number, valor: string) => {
    const num = parseInt(valor, 10);
    setQuantidades((prev) => {
      if (isNaN(num) || num <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: num };
    });
  };

  const itensSelecionados = Object.entries(quantidades).filter(([_, q]) => q > 0);
  const totalItens = itensSelecionados.reduce((acc, [_, q]) => acc + q, 0);

  const valorTotalGeral = itensSelecionados.reduce((acc, [idStr, q]) => {
    const prod = produtos.find((p) => p.id === Number(idStr));
    return acc + (prod ? Number(prod.preco) * q : 0);
  }, 0);

  const produtosFiltrados = produtos.filter((p) => {
    const matchCat = categoriaAtiva === "todas" || p.categoria === categoriaAtiva;
    const matchBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(busca.toLowerCase()));
    return matchCat && matchBusca;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itensSelecionados.length === 0) {
      setErro("Selecione ao menos um produto e quantidade para fazer o pedido.");
      return;
    }

    setIsSubmitting(true);
    setErro(null);

    const payload = itensSelecionados.map(([idStr, qtd]) => ({
      idProduto: Number(idStr),
      quantidade: qtd,
    }));

    try {
      const res = await criarPedidoAction(payload, observacao);
      if (!res.success) {
        setErro(res.error || "Erro ao criar pedido.");
        setIsSubmitting(false);
      } else {
        router.push("/escola");
      }
    } catch (err: any) {
      setErro(err.message || "Erro inesperado.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Barra de Topo */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/escola"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Criar Novo Pedido</h1>
            <p className="text-xs text-slate-500">
              Solicitando para: <span className="text-slate-800 font-bold">{nomeEscola}</span>
            </p>
          </div>
        </div>

        {/* Resumo Rápido */}
        <div className="text-right">
          <span className="text-xs text-slate-500 font-medium block">Total Previsto</span>
          <span className="text-xl font-extrabold text-emerald-600 font-mono">
            R$ {valorTotalGeral.toFixed(2)}
          </span>
        </div>
      </div>

      {erro && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{erro}</span>
        </div>
      )}

      {/* Filtros e Busca de Produtos */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto por nome..."
          className="flex-1 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categorias.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition cursor-pointer ${
                categoriaAtiva === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {produtosFiltrados.map((prod) => {
          const qtd = quantidades[prod.id] || 0;
          const isSelected = qtd > 0;

          return (
            <div
              key={prod.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-sm ${
                isSelected
                  ? "bg-blue-50/50 border-blue-400 shadow-blue-500/10"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {prod.categoria}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    R$ {Number(prod.preco).toFixed(2)} / {prod.unidade}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-slate-900">
                  {prod.nome}
                </h3>
                {prod.descricao && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {prod.descricao}
                  </p>
                )}
              </div>

              {/* Controle de Quantidade */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Quantidade:</span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantidade(prod.id, -1)}
                    disabled={qtd === 0}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={qtd === 0 ? "" : qtd}
                    onChange={(e) => handleSetQuantidadeDireta(prod.id, e.target.value)}
                    placeholder="0"
                    className="w-14 h-8 rounded-lg bg-white border border-slate-300 text-center font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />

                  <button
                    type="button"
                    onClick={() => handleUpdateQuantidade(prod.id, 1)}
                    className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Observações da Escola */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Observações adicionais para a Secretaria (Opcional)
        </label>
        <textarea
          rows={2}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Ex: Entrega preferencial no portão lateral da escola no período matutino."
          className="w-full rounded-xl bg-white border border-slate-300 p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
        />
      </div>

      {/* Barra de Submissão Flutuante */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">
              {totalItens === 0
                ? "Nenhum item selecionado"
                : `${totalItens} unidades selecionadas em ${itensSelecionados.length} produto(s)`}
            </p>
            <p className="text-base font-extrabold text-slate-900">
              Total Previsto:{" "}
              <span className="text-emerald-600 font-mono">
                R$ {valorTotalGeral.toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/escola"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || totalItens === 0}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Enviar Pedido para Análise</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
