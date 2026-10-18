"use client";

import { useState } from "react";
import { darBaixaEstoqueAction } from "@/actions/estoque-actions";
import {
  Boxes,
  School,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  Search,
  X,
  Package,
} from "lucide-react";

interface LoteSecretaria {
  idLote: number;
  idEscola: number;
  nomeEscola: string;
  idProduto: number;
  nomeProduto: string;
  categoria: string;
  unidade: string;
  estoqueMinimo: number;
  validade: string | null;
  quantidadeAtual: number;
}

export function EstoqueSecretariaClient({
  escolas,
  lotesIniciais,
}: {
  escolas: { id: number; nome: string }[];
  lotesIniciais: LoteSecretaria[];
}) {
  const [filtroEscola, setFiltroEscola] = useState<string>("todas");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [busca, setBusca] = useState("");

  const [loteParaBaixa, setLoteParaBaixa] = useState<LoteSecretaria | null>(null);
  const [tipoBaixa, setTipoBaixa] = useState<
    "baixa_consumo" | "baixa_vencido" | "baixa_perda" | "ajuste"
  >("baixa_consumo");
  const [quantidadeBaixa, setQuantidadeBaixa] = useState<number>(1);
  const [motivoBaixa, setMotivoBaixa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const categorias = [
    "todas",
    ...Array.from(new Set(lotesIniciais.map((l) => l.categoria))),
  ];

  const isValidadeProxima = (validadeStr: string | null) => {
    if (!validadeStr) return false;
    const dataVal = new Date(validadeStr + "T00:00:00");
    const hoje = new Date();
    const diffDias = Math.ceil((dataVal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias <= 14;
  };

  const lotesFiltrados = lotesIniciais.filter((l) => {
    const matchEscola = filtroEscola === "todas" || l.idEscola.toString() === filtroEscola;
    const matchCat = filtroCategoria === "todas" || l.categoria === filtroCategoria;
    const matchBusca =
      l.nomeProduto.toLowerCase().includes(busca.toLowerCase()) ||
      l.nomeEscola.toLowerCase().includes(busca.toLowerCase());
    return matchEscola && matchCat && matchBusca;
  });

  const handleConfirmarBaixa = async () => {
    if (!loteParaBaixa) return;
    if (quantidadeBaixa <= 0 || quantidadeBaixa > loteParaBaixa.quantidadeAtual) {
      setErro(`A quantidade deve ser entre 1 e ${loteParaBaixa.quantidadeAtual}`);
      return;
    }

    setIsSubmitting(true);
    setErro(null);

    try {
      const res = await darBaixaEstoqueAction({
        idEstoqueLote: loteParaBaixa.idLote,
        quantidade: quantidadeBaixa,
        tipo: tipoBaixa,
        motivo: motivoBaixa || `Baixa (${tipoBaixa}) efetuada pela Secretaria`,
      });

      if (!res.success) {
        setErro(res.error || "Erro ao dar baixa no estoque.");
      } else {
        setLoteParaBaixa(null);
        setQuantidadeBaixa(1);
        setMotivoBaixa("");
      }
    } catch (err: any) {
      setErro(err.message || "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Seletor de Escola */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <School className="w-4 h-4 text-slate-500" />
          <select
            value={filtroEscola}
            onChange={(e) => setFiltroEscola(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="todas">Todas as Escolas</option>
            {escolas.map((esc) => (
              <option key={esc.id} value={esc.id.toString()}>
                {esc.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Busca por Produto */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por produto ou escola..."
            className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-sm"
          />
        </div>

        {/* Categorias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categorias.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition cursor-pointer ${
                filtroCategoria === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela Central de Estoques */}
      {lotesFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white shadow-sm">
          <Boxes className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhum lote registrado para os filtros selecionados
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Quando os pedidos são marcados como entregues pela Secretaria, os itens dão entrada no estoque da unidade correspondente.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Unidade Escolar</th>
                  <th className="py-3.5 px-4">Produto / Lote</th>
                  <th className="py-3.5 px-4">Categoria</th>
                  <th className="py-3.5 px-4">Validade</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Saldo Atual</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lotesFiltrados.map((lote) => {
                  const vencendoLogo = isValidadeProxima(lote.validade);

                  return (
                    <tr key={lote.idLote} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <School className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{lote.nomeEscola}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">{lote.nomeProduto}</span>
                        <span className="block text-[10px] font-mono text-slate-500 font-normal">
                          Lote #{lote.idLote.toString().padStart(4, "0")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {lote.categoria}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {lote.validade ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {new Date(lote.validade + "T00:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Não perecível</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {vencendoLogo ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Vence em breve</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Regular</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono text-sm font-extrabold text-slate-900">
                          {lote.quantidadeAtual}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium ml-1">{lote.unidade}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          disabled={lote.quantidadeAtual === 0}
                          onClick={() => {
                            setLoteParaBaixa(lote);
                            setQuantidadeBaixa(1);
                            setTipoBaixa("baixa_consumo");
                            setMotivoBaixa("");
                            setErro(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 transition disabled:opacity-40 cursor-pointer"
                        >
                          <MinusCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Baixa</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Baixa de Estoque da Secretaria */}
      {loteParaBaixa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <MinusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Baixa de Estoque</h3>
                  <p className="text-xs text-slate-500">
                    {loteParaBaixa.nomeEscola} — {loteParaBaixa.nomeProduto}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLoteParaBaixa(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{erro}</span>
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                <span className="text-slate-600 font-medium">Saldo atual do lote:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {loteParaBaixa.quantidadeAtual} {loteParaBaixa.unidade}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tipo / Justificativa da Baixa <span className="text-red-500">*</span>
                </label>
                <select
                  value={tipoBaixa}
                  onChange={(e) => setTipoBaixa(e.target.value as any)}
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                >
                  <option value="baixa_consumo">Consumo Regular (Merenda / Limpeza / Aulas)</option>
                  <option value="baixa_vencido">Produto Vencido / Descarte Sanitário</option>
                  <option value="baixa_perda">Avaria / Perda Física / Deterioração</option>
                  <option value="ajuste">Ajuste de Inventário / Contagem Física</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Quantidade a Baixar <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={loteParaBaixa.quantidadeAtual}
                  value={quantidadeBaixa}
                  onChange={(e) => setQuantidadeBaixa(Number(e.target.value))}
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 font-mono text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Detalhamento / Observações (Opcional)
                </label>
                <input
                  type="text"
                  value={motivoBaixa}
                  onChange={(e) => setMotivoBaixa(e.target.value)}
                  placeholder="Ex: Auditoria semestral realizada pelo fiscal da secretaria"
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLoteParaBaixa(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmarBaixa}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Registrar Baixa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
