"use client";

import { useState } from "react";
import { cancelarPedidoAction } from "@/actions/pedido-actions";
import {
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Calendar,
  AlertCircle,
  FileText,
  X,
  Eye,
} from "lucide-react";

interface ItemPedido {
  idProduto: number;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: string;
  unidade: string;
}

interface HistoricoStatus {
  status: string;
  observacao: string | null;
  data: Date;
}

interface PedidoCardProps {
  id: number;
  status: "em_analise" | "confirmado" | "em_preparo" | "entregue" | "cancelado";
  dataSolicitacao: Date;
  dataPrevistaEntrega: string | null;
  dataEntrega: Date | null;
  observacao: string | null;
  motivoCancelamento: string | null;
  itens: ItemPedido[];
  historico: HistoricoStatus[];
  valorTotal: number;
}

const statusConfig = {
  em_analise: {
    label: "Em Análise",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  confirmado: {
    label: "Confirmado",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: CheckCircle2,
  },
  em_preparo: {
    label: "Em Preparo",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Truck,
  },
  entregue: {
    label: "Entregue",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: PackageCheck,
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
};

export function ListaPedidosEscolaClient({
  pedidosIniciais,
}: {
  pedidosIniciais: PedidoCardProps[];
}) {
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [pedidoDetalhe, setPedidoDetalhe] = useState<PedidoCardProps | null>(null);
  const [pedidoCancelando, setPedidoCancelando] = useState<PedidoCardProps | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [loadingAcao, setLoadingAcao] = useState(false);

  const pedidosFiltrados = pedidosIniciais.filter((p) => {
    if (filtroStatus === "todos") return true;
    return p.status === filtroStatus;
  });

  const handleConfirmarCancelamento = async () => {
    if (!pedidoCancelando) return;
    if (!motivoCancelamento.trim()) {
      setErroAcao("O motivo do cancelamento é obrigatório.");
      return;
    }

    setLoadingAcao(true);
    setErroAcao(null);
    try {
      const res = await cancelarPedidoAction(pedidoCancelando.id, motivoCancelamento);
      if (!res.success) {
        setErroAcao(res.error || "Erro ao cancelar pedido.");
      } else {
        setPedidoCancelando(null);
        setMotivoCancelamento("");
      }
    } catch (err: any) {
      setErroAcao(err.message || "Erro inesperado.");
    } finally {
      setLoadingAcao(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "todos", label: "Todos os Pedidos" },
          { key: "em_analise", label: "Em Análise" },
          { key: "confirmado", label: "Confirmados" },
          { key: "em_preparo", label: "Em Preparo" },
          { key: "entregue", label: "Entregues" },
          { key: "cancelado", label: "Cancelados" },
        ].map((tab) => {
          const isActive = filtroStatus === tab.key;
          const count =
            tab.key === "todos"
              ? pedidosIniciais.length
              : pedidosIniciais.filter((p) => p.status === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setFiltroStatus(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid de Cards de Pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white shadow-sm">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhum pedido encontrado
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não há registros de pedidos para o status selecionado. Use o botão "Fazer Novo Pedido" para solicitar materiais.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pedidosFiltrados.map((ped) => {
            const config = statusConfig[ped.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={ped.id}
                className="rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-5 flex flex-col justify-between shadow-sm"
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      #{ped.id.toString().padStart(4, "0")}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.color}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{config.label}</span>
                    </span>
                  </div>

                  {/* Informações de Datas */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        Solicitado em:{" "}
                        <strong className="text-slate-800">
                          {new Date(ped.dataSolicitacao).toLocaleDateString("pt-BR")}
                        </strong>
                      </span>
                    </div>

                    {ped.dataPrevistaEntrega && (
                      <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                        <Truck className="w-4 h-4 text-indigo-500" />
                        <span>
                          Previsão de entrega:{" "}
                          <strong>
                            {new Date(
                              ped.dataPrevistaEntrega + "T00:00:00"
                            ).toLocaleDateString("pt-BR")}
                          </strong>
                        </span>
                      </div>
                    )}

                    {ped.status === "cancelado" && ped.motivoCancelamento && (
                      <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mt-2">
                        <strong>Motivo:</strong> {ped.motivoCancelamento}
                      </div>
                    )}
                  </div>

                  {/* Lista Resumida de Itens */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Itens do Pedido ({ped.itens.length})
                    </p>
                    <div className="space-y-1.5">
                      {ped.itens.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-slate-700"
                        >
                          <span className="truncate pr-2 font-medium">{item.nomeProduto}</span>
                          <span className="shrink-0 font-bold text-slate-900">
                            {item.quantidade} {item.unidade}
                          </span>
                        </div>
                      ))}
                      {ped.itens.length > 3 && (
                        <p className="text-[11px] text-blue-600 font-bold pt-1">
                          + {ped.itens.length - 3} outros itens...
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card com Ações */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">Total Est.</span>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      R$ {ped.valorTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botão de Cancelamento: Visível somente se em_analise */}
                    {ped.status === "em_analise" && (
                      <button
                        type="button"
                        onClick={() => {
                          setPedidoCancelando(ped);
                          setMotivoCancelamento("");
                          setErroAcao(null);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPedidoDetalhe(ped)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detalhes</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes do Pedido */}
      {pedidoDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Pedido #{pedidoDetalhe.id.toString().padStart(4, "0")}</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      statusConfig[pedidoDetalhe.status].color
                    }`}
                  >
                    {statusConfig[pedidoDetalhe.status].label}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Solicitado em{" "}
                  {new Date(pedidoDetalhe.dataSolicitacao).toLocaleString("pt-BR")}
                </p>
              </div>
              <button
                onClick={() => setPedidoDetalhe(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-5 pr-1">
              {/* Tabela de Itens */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Produtos Solicitados
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3 text-right">Qtd</th>
                        <th className="py-2.5 px-3 text-right">Unitário</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pedidoDetalhe.itens.map((it, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {it.nomeProduto}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium">
                            {it.quantidade} {it.unidade}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            R$ {Number(it.precoUnitario).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            R$ {(Number(it.precoUnitario) * it.quantidade).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 text-right">
                          Total Geral:
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-mono text-sm font-extrabold">
                          R$ {pedidoDetalhe.valorTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Observação */}
              {pedidoDetalhe.observacao && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <strong className="text-slate-900 block mb-1">Observações da Escola:</strong>
                  {pedidoDetalhe.observacao}
                </div>
              )}

              {/* Linha do Tempo / Histórico de Status */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Histórico de Tramitação
                </h4>
                <div className="space-y-2 border-l-2 border-slate-200 ml-2 pl-4">
                  {pedidoDetalhe.historico.map((h, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span className="capitalize">{h.status.replace("_", " ")}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {new Date(h.data).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      {h.observacao && (
                        <p className="text-[11px] text-slate-600 mt-0.5">{h.observacao}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPedidoDetalhe(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento */}
      {pedidoCancelando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <div className="p-2 rounded-xl bg-red-100 text-red-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cancelar Pedido #{pedidoCancelando.id.toString().padStart(4, "0")}
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação não poderá ser desfeita após a confirmação.
                </p>
              </div>
            </div>

            {erroAcao && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {erroAcao}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Motivo do cancelamento <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Ex: Erro na quantidade de itens, solicitação duplicada, etc."
                className="w-full rounded-xl bg-white border border-slate-300 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                disabled={loadingAcao}
                onClick={() => setPedidoCancelando(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={loadingAcao}
                onClick={handleConfirmarCancelamento}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingAcao ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Confirmar Cancelamento</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
