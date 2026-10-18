"use client";

import { useState, useRef } from "react";
import {
  confirmarPedidoAction,
  iniciarPreparoAction,
  marcarEntregueAction,
  cancelarPedidoAction,
} from "@/actions/pedido-actions";
import {
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  FileSpreadsheet,
  Upload,
  Calendar,
  School,
  AlertCircle,
  Eye,
  X,
  Package,
} from "lucide-react";

interface ItemPedido {
  idProduto: number;
  nomeProduto: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  precoUnitario: string;
  idFornecedor: number | null;
  nomeFornecedor: string | null;
}

interface HistoricoStatus {
  status: string;
  observacao: string | null;
  data: Date;
}

interface PedidoSecretaria {
  id: number;
  idEscola: number;
  nomeEscola: string;
  nomeSolicitante: string;
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

export function PainelSecretariaClient({
  pedidosIniciais,
  escolas,
  fornecedores,
}: {
  pedidosIniciais: PedidoSecretaria[];
  escolas: { id: number; nome: string }[];
  fornecedores: { id: number; nome: string }[];
}) {
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroEscola, setFiltroEscola] = useState<string>("todas");
  const [pedidoDetalhe, setPedidoDetalhe] = useState<PedidoSecretaria | null>(null);

  // Estados de modais de transição de status
  const [pedidoPreparo, setPedidoPreparo] = useState<PedidoSecretaria | null>(null);
  const [dataPrevisao, setDataPrevisao] = useState("");
  const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState<Record<number, number>>({});

  const [pedidoEntrega, setPedidoEntrega] = useState<PedidoSecretaria | null>(null);
  const [validadesPorItem, setValidadesPorItem] = useState<Record<number, string>>({});

  const [pedidoCancelando, setPedidoCancelando] = useState<PedidoSecretaria | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");

  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [arquivoUpload, setArquivoUpload] = useState<File | null>(null);
  const [resultadoImportacao, setResultadoImportacao] = useState<{
    success?: boolean;
    importados?: number;
    error?: string;
  } | null>(null);

  const [loadingAcao, setLoadingAcao] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtragem
  const pedidosFiltrados = pedidosIniciais.filter((p) => {
    const matchStatus = filtroStatus === "todos" || p.status === filtroStatus;
    const matchEscola = filtroEscola === "todas" || p.idEscola.toString() === filtroEscola;
    return matchStatus && matchEscola;
  });

  // Ações de Tramitação
  const handleConfirmarPedido = async (idPedido: number) => {
    setLoadingAcao(true);
    try {
      const res = await confirmarPedidoAction(idPedido);
      if (!res.success) alert(res.error);
    } finally {
      setLoadingAcao(false);
    }
  };

  const handleSubmeterPreparo = async () => {
    if (!pedidoPreparo || !dataPrevisao) {
      setErroAcao("A data prevista de entrega é obrigatória.");
      return;
    }
    setLoadingAcao(true);
    setErroAcao(null);
    try {
      const res = await iniciarPreparoAction(
        pedidoPreparo.id,
        dataPrevisao,
        fornecedoresSelecionados
      );
      if (!res.success) {
        setErroAcao(res.error || "Erro ao iniciar preparo.");
      } else {
        setPedidoPreparo(null);
        setDataPrevisao("");
      }
    } finally {
      setLoadingAcao(false);
    }
  };

  const handleSubmeterEntrega = async () => {
    if (!pedidoEntrega) return;
    setLoadingAcao(true);
    setErroAcao(null);
    try {
      const res = await marcarEntregueAction(pedidoEntrega.id, validadesPorItem);
      if (!res.success) {
        setErroAcao(res.error || "Erro ao confirmar entrega.");
      } else {
        setPedidoEntrega(null);
        setValidadesPorItem({});
      }
    } finally {
      setLoadingAcao(false);
    }
  };

  const handleConfirmarCancelamento = async () => {
    if (!pedidoCancelando || !motivoCancelamento.trim()) {
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
    } finally {
      setLoadingAcao(false);
    }
  };

  // Upload Excel
  const handleUploadPlanilha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoUpload) return;

    setLoadingAcao(true);
    setResultadoImportacao(null);
    try {
      const formData = new FormData();
      formData.append("planilha", arquivoUpload);

      const resp = await fetch("/api/produtos/importar", {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok) {
        setResultadoImportacao({ error: data.error || "Erro no envio." });
      } else {
        setResultadoImportacao({ success: true, importados: data.importados });
        setArquivoUpload(null);
      }
    } catch (err: any) {
      setResultadoImportacao({ error: err.message });
    } finally {
      setLoadingAcao(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações do Topo: Filtros e Botões Excel */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Escola */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <School className="w-4 h-4 text-slate-500" />
            <select
              value={filtroEscola}
              onChange={(e) => setFiltroEscola(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas as Escolas ({escolas.length})</option>
              {escolas.map((esc) => (
                <option key={esc.id} value={esc.id.toString()}>
                  {esc.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Status */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { key: "todos", label: "Todos" },
              { key: "em_analise", label: "Em Análise" },
              { key: "confirmado", label: "Confirmados" },
              { key: "em_preparo", label: "Em Preparo" },
              { key: "entregue", label: "Entregues" },
              { key: "cancelado", label: "Cancelados" },
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setFiltroStatus(st.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  filtroStatus === st.key
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botões Excel */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setModalImportarAberto(true);
              setResultadoImportacao(null);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition border border-slate-300 shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Importar (.xlsx)</span>
          </button>

          <a
            href={`/api/relatorios/pedidos?status=${filtroStatus}&escola=${filtroEscola}`}
            download
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Relatório</span>
          </a>
        </div>
      </div>

      {/* Tabela de Pedidos da Secretaria */}
      {pedidosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white shadow-sm">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhum pedido encontrado
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Ajuste os filtros de status ou de unidade escolar para localizar os registros desejados.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Pedido / Escola</th>
                  <th className="py-3.5 px-4">Solicitante</th>
                  <th className="py-3.5 px-4">Data Solicitação</th>
                  <th className="py-3.5 px-4">Status Atual</th>
                  <th className="py-3.5 px-4">Previsão Entrega</th>
                  <th className="py-3.5 px-4 text-right">Total Est.</th>
                  <th className="py-3.5 px-4 text-center">Ações de Tramitação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedidosFiltrados.map((ped) => {
                  const config = statusConfig[ped.status];
                  const StatusIcon = config.icon;

                  return (
                    <tr key={ped.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-blue-600 font-bold">
                            #{ped.id.toString().padStart(4, "0")}
                          </span>
                          <span className="text-slate-900 font-bold">{ped.nomeEscola}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {ped.nomeSolicitante}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {new Date(ped.dataSolicitacao).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{config.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {ped.dataPrevistaEntrega ? (
                          <span className="text-indigo-700 font-bold">
                            {new Date(
                              ped.dataPrevistaEntrega + "T00:00:00"
                            ).toLocaleDateString("pt-BR")}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                        R$ {ped.valorTotal.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Transição 1: Confirmar se em_analise */}
                          {ped.status === "em_analise" && (
                            <button
                              type="button"
                              onClick={() => handleConfirmarPedido(ped.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-sm"
                              title="Aprovar e Confirmar Pedido"
                            >
                              Confirmar
                            </button>
                          )}

                          {/* Transição 2: Iniciar preparo se confirmado */}
                          {ped.status === "confirmado" && (
                            <button
                              type="button"
                              onClick={() => {
                                setPedidoPreparo(ped);
                                setDataPrevisao("");
                                setErroAcao(null);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer shadow-sm"
                              title="Definir Data Prevista e Fornecedores"
                            >
                              Em Preparo
                            </button>
                          )}

                          {/* Transição 3: Entregar se em_preparo */}
                          {ped.status === "em_preparo" && (
                            <button
                              type="button"
                              onClick={() => {
                                setPedidoEntrega(ped);
                                setValidadesPorItem({});
                                setErroAcao(null);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm"
                              title="Conferir Entrega e Inserir no Estoque"
                            >
                              Dar Entrega
                            </button>
                          )}

                          {/* Cancelar (antes de entregue) */}
                          {ped.status !== "entregue" && ped.status !== "cancelado" && (
                            <button
                              type="button"
                              onClick={() => {
                                setPedidoCancelando(ped);
                                setMotivoCancelamento("");
                                setErroAcao(null);
                              }}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer"
                              title="Cancelar Pedido"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Detalhes */}
                          <button
                            type="button"
                            onClick={() => setPedidoDetalhe(ped)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                            title="Ver Detalhes do Pedido"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Iniciar Preparo */}
      {pedidoPreparo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Iniciar Preparo — Pedido #{pedidoPreparo.id.toString().padStart(4, "0")}
                  </h3>
                  <p className="text-xs text-slate-500">{pedidoPreparo.nomeEscola}</p>
                </div>
              </div>
              <button
                onClick={() => setPedidoPreparo(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroAcao && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {erroAcao}
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Data Prevista de Entrega <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dataPrevisao}
                  onChange={(e) => setDataPrevisao(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 p-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Designar Fornecedor por Item (Opcional)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pedidoPreparo.itens.map((it) => (
                    <div
                      key={it.idProduto}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-slate-900 font-bold truncate">
                        {it.nomeProduto} ({it.quantidade} {it.unidade})
                      </span>
                      <select
                        value={fornecedoresSelecionados[it.idProduto] || ""}
                        onChange={(e) =>
                          setFornecedoresSelecionados({
                            ...fornecedoresSelecionados,
                            [it.idProduto]: Number(e.target.value),
                          })
                        }
                        className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg p-1.5 focus:outline-none"
                      >
                        <option value="">Selecione o Fornecedor...</option>
                        {fornecedores.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPedidoPreparo(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={loadingAcao || !dataPrevisao}
                onClick={handleSubmeterPreparo}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {loadingAcao ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Avançar para Em Preparo</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Marcar como Entregue */}
      {pedidoEntrega && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Conferir e Confirmar Entrega
                  </h3>
                  <p className="text-xs text-slate-500">
                    Os itens entrarão imediatamente no estoque da unidade escolar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPedidoEntrega(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroAcao && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {erroAcao}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-700 font-medium">
                Informe o prazo de validade impresso nas embalagens recebidas:
              </p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {pedidoEntrega.itens.map((it) => (
                  <div
                    key={it.idProduto}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {it.nomeProduto}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {it.quantidade} {it.unidade}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <label className="text-xs font-medium text-slate-600">Validade:</label>
                      <input
                        type="date"
                        value={validadesPorItem[it.idProduto] || ""}
                        onChange={(e) =>
                          setValidadesPorItem({
                            ...validadesPorItem,
                            [it.idProduto]: e.target.value,
                          })
                        }
                        className="bg-white border border-slate-300 text-xs text-slate-800 rounded-lg p-1.5 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPedidoEntrega(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={loadingAcao}
                onClick={handleSubmeterEntrega}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loadingAcao ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Confirmar Recebimento e Estoque</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Cancelar Pedido */}
      {pedidoCancelando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <div className="p-2 rounded-xl bg-red-100 text-red-600">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cancelar Pedido #{pedidoCancelando.id.toString().padStart(4, "0")}
                </h3>
                <p className="text-xs text-slate-500">
                  {pedidoCancelando.nomeEscola}
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
                Motivo do cancelamento institucional <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Ex: Falta de estoque no fornecedor, readequação orçamentária, etc."
                className="w-full rounded-xl bg-white border border-slate-300 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPedidoCancelando(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={loadingAcao}
                onClick={handleConfirmarCancelamento}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loadingAcao ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Cancelar Pedido</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Importar Catálogo */}
      {modalImportarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Importar Produtos (.xlsx)</h3>
                  <p className="text-xs text-slate-500">Adicione ou atualize produtos via Excel</p>
                </div>
              </div>
              <button
                onClick={() => setModalImportarAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadPlanilha} className="mt-4 space-y-4">
              {resultadoImportacao?.error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {resultadoImportacao.error}
                </div>
              )}

              {resultadoImportacao?.success && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {resultadoImportacao.importados} produto(s) cadastrados com sucesso!
                  </span>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-slate-400 transition bg-slate-50">
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-800 font-bold mb-1">
                  {arquivoUpload ? arquivoUpload.name : "Clique para selecionar o arquivo .xlsx"}
                </p>
                <p className="text-[11px] text-slate-500">
                  Colunas esperadas: Nome, Categoria, Unidade, Preço, Estoque Mínimo, Descrição
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setArquivoUpload(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 shadow-sm transition cursor-pointer"
                >
                  Procurar Arquivo
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalImportarAberto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={!arquivoUpload || loadingAcao}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {loadingAcao ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Processar Importação</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Ver Detalhes */}
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
                  Unidade: <strong className="text-slate-900">{pedidoDetalhe.nomeEscola}</strong> — Solicitado por: {pedidoDetalhe.nomeSolicitante}
                </p>
              </div>
              <button
                onClick={() => setPedidoDetalhe(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              {/* Tabela de Itens */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Fornecedor</th>
                      <th className="py-2.5 px-3 text-right">Qtd</th>
                      <th className="py-2.5 px-3 text-right">Unitário</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pedidoDetalhe.itens.map((it, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {it.nomeProduto}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {it.nomeFornecedor || "-"}
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
                      <td colSpan={4} className="py-2.5 px-3 text-right">
                        Total Estimado:
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-mono text-sm font-extrabold">
                        R$ {pedidoDetalhe.valorTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {pedidoDetalhe.observacao && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <strong className="text-slate-900 block mb-1">Observações da Escola:</strong>
                  {pedidoDetalhe.observacao}
                </div>
              )}

              {pedidoDetalhe.motivoCancelamento && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  <strong className="text-red-700 block mb-1">Motivo do Cancelamento:</strong>
                  {pedidoDetalhe.motivoCancelamento}
                </div>
              )}

              {/* Histórico */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Trilha de Auditoria & Tramitação
                </h4>
                <div className="space-y-2 border-l-2 border-slate-200 ml-2 pl-4">
                  {pedidoDetalhe.historico.map((h, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
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
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
