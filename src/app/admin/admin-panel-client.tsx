"use client";

import { useState } from "react";
import {
  criarEscolaAction,
  criarUsuarioAction,
  criarProdutoAction,
  criarFornecedorAction,
} from "@/actions/admin-actions";
import {
  Users,
  School,
  Package,
  Truck,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Building,
  Phone,
  FileText,
} from "lucide-react";

interface AdminPanelProps {
  escolas: any[];
  usuarios: any[];
  produtos: any[];
  fornecedores: any[];
}

export function AdminPanelClient({
  escolas,
  usuarios,
  produtos,
  fornecedores,
}: AdminPanelProps) {
  const [abaAtiva, setAbaAtiva] = useState<"usuarios" | "escolas" | "produtos" | "fornecedores">(
    "usuarios"
  );

  // Modais de Criação
  const [modalUsuario, setModalUsuario] = useState(false);
  const [modalEscola, setModalEscola] = useState(false);
  const [modalProduto, setModalProduto] = useState(false);
  const [modalFornecedor, setModalFornecedor] = useState(false);

  // Formulário Usuário
  const [uNome, setUNome] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uSenha, setUSenha] = useState("123456");
  const [uPapel, setUPapel] = useState<"escola" | "secretaria" | "administrador">("escola");
  const [uIdEscola, setUIdEscola] = useState<string>(escolas[0]?.id?.toString() || "");

  // Formulário Escola
  const [eNome, setENome] = useState("");
  const [eEndereco, setEEndereco] = useState("");
  const [eTelefone, setETelefone] = useState("");

  // Formulário Produto
  const [pNome, setPNome] = useState("");
  const [pCategoria, setPCategoria] = useState<
    "limpeza" | "higiene" | "alimento" | "material" | "outros"
  >("alimento");
  const [pUnidade, setPUnidade] = useState("un");
  const [pPreco, setPPreco] = useState("10.00");
  const [pEstoqueMin, setPEstoqueMin] = useState(10);
  const [pDescricao, setPDescricao] = useState("");

  // Formulário Fornecedor
  const [fNome, setFNome] = useState("");
  const [fCnpj, setFCnpj] = useState("");
  const [fContato, setFContato] = useState("");
  const [fTelefone, setFTelefone] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Submissão Usuário
  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    try {
      const res = await criarUsuarioAction(
        uNome,
        uEmail,
        uSenha,
        uPapel,
        uPapel === "escola" ? Number(uIdEscola) : null
      );
      if (!res.success) {
        setErro(res.error || "Erro ao criar usuário.");
      } else {
        setModalUsuario(false);
        setUNome("");
        setUEmail("");
      }
    } finally {
      setLoading(false);
    }
  };

  // Submissão Escola
  const handleCriarEscola = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    try {
      const res = await criarEscolaAction(eNome, eEndereco, eTelefone);
      if (!res.success) {
        setErro(res.error || "Erro ao criar escola.");
      } else {
        setModalEscola(false);
        setENome("");
        setEEndereco("");
        setETelefone("");
      }
    } finally {
      setLoading(false);
    }
  };

  // Submissão Produto
  const handleCriarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    try {
      const res = await criarProdutoAction(
        pNome,
        pCategoria,
        pUnidade,
        Number(pPreco),
        Number(pEstoqueMin),
        pDescricao
      );
      if (!res.success) {
        setErro(res.error || "Erro ao criar produto.");
      } else {
        setModalProduto(false);
        setPNome("");
        setPDescricao("");
      }
    } finally {
      setLoading(false);
    }
  };

  // Submissão Fornecedor
  const handleCriarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    try {
      const res = await criarFornecedorAction(fNome, fCnpj, fContato, fTelefone);
      if (!res.success) {
        setErro(res.error || "Erro ao criar fornecedor.");
      } else {
        setModalFornecedor(false);
        setFNome("");
        setFCnpj("");
        setFContato("");
        setFTelefone("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Abas Superiores */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setAbaAtiva("usuarios")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            abaAtiva === "usuarios"
              ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
              : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários ({usuarios.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva("escolas")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            abaAtiva === "escolas"
              ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
              : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <School className="w-4 h-4" />
          <span>Escolas ({escolas.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva("produtos")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            abaAtiva === "produtos"
              ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
              : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produtos ({produtos.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva("fornecedores")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            abaAtiva === "fornecedores"
              ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
              : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Fornecedores ({fornecedores.length})</span>
        </button>
      </div>

      {/* Conteúdo Aba: Usuários */}
      {abaAtiva === "usuarios" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Usuários Cadastrados</h2>
            <button
              onClick={() => {
                setModalUsuario(true);
                setErro(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Nome</th>
                  <th className="py-3.5 px-4">E-mail</th>
                  <th className="py-3.5 px-4">Papel</th>
                  <th className="py-3.5 px-4">Unidade Vinculada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u: any) => (
                  <tr key={u.idAuth} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.nome}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {u.papel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {u.nomeEscola ? (
                        <span className="text-emerald-700 font-bold">{u.nomeEscola}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo Aba: Escolas */}
      {abaAtiva === "escolas" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Unidades Escolares</h2>
            <button
              onClick={() => {
                setModalEscola(true);
                setErro(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Escola</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {escolas.map((e: any) => (
              <div
                key={e.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{e.nome}</h3>
                    <span className="text-[10px] font-mono text-slate-500 font-medium">
                      Código #{e.id.toString().padStart(3, "0")}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p>
                    <strong>Endereço:</strong> {e.endereco || "Não informado"}
                  </p>
                  <p>
                    <strong>Telefone:</strong> {e.telefone || "Não informado"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo Aba: Produtos */}
      {abaAtiva === "produtos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Catálogo de Produtos</h2>
            <button
              onClick={() => {
                setModalProduto(true);
                setErro(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Nome</th>
                  <th className="py-3.5 px-4">Categoria</th>
                  <th className="py-3.5 px-4">Unidade</th>
                  <th className="py-3.5 px-4 text-right">Preço</th>
                  <th className="py-3.5 px-4 text-right">Estoque Mínimo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {produtos.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.nome}</td>
                    <td className="py-3.5 px-4 capitalize font-medium">{p.categoria}</td>
                    <td className="py-3.5 px-4 font-mono">{p.unidade}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                      R$ {Number(p.preco).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-700 font-bold">
                      {p.estoqueMinimo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo Aba: Fornecedores */}
      {abaAtiva === "fornecedores" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Fornecedores Credenciados</h2>
            <button
              onClick={() => {
                setModalFornecedor(true);
                setErro(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Fornecedor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fornecedores.map((f: any) => (
              <div
                key={f.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{f.nome}</h3>
                    <span className="text-[10px] font-mono text-slate-500 font-medium">
                      CNPJ: {f.cnpj || "Não cadastrado"}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    <strong>Contato:</strong> {f.contato || "-"}
                  </p>
                  <p>
                    <strong>Telefone:</strong> {f.telefone || "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Criar Usuário */}
      {modalUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Usuário</h3>
              <button
                onClick={() => setModalUsuario(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {erro}
              </div>
            )}

            <form onSubmit={handleCriarUsuario} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={uNome}
                  onChange={(e) => setUNome(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Institucional
                </label>
                <input
                  type="email"
                  required
                  value={uEmail}
                  onChange={(e) => setUEmail(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Senha</label>
                <input
                  type="password"
                  required
                  value={uSenha}
                  onChange={(e) => setUSenha(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Papel de Acesso
                </label>
                <select
                  value={uPapel}
                  onChange={(e) => setUPapel(e.target.value as any)}
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-purple-600"
                >
                  <option value="escola">Escola (Apenas sua unidade)</option>
                  <option value="secretaria">Secretaria de Educação</option>
                  <option value="administrador">Administrador Geral</option>
                </select>
              </div>

              {uPapel === "escola" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidade Escolar Vinculada
                  </label>
                  <select
                    value={uIdEscola}
                    onChange={(e) => setUIdEscola(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-purple-600"
                  >
                    {escolas.map((esc) => (
                      <option key={esc.id} value={esc.id}>
                        {esc.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalUsuario(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white cursor-pointer shadow-sm"
                >
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Escola */}
      {modalEscola && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Cadastrar Unidade Escolar</h3>
              <button
                onClick={() => setModalEscola(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {erro}
              </div>
            )}

            <form onSubmit={handleCriarEscola} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Escola
                </label>
                <input
                  type="text"
                  required
                  value={eNome}
                  onChange={(e) => setENome(e.target.value)}
                  placeholder="Ex: E.M. Paulo Freire"
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={eEndereco}
                  onChange={(e) => setEEndereco(e.target.value)}
                  placeholder="Ex: Rua das Palmeiras, 100"
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={eTelefone}
                  onChange={(e) => setETelefone(e.target.value)}
                  placeholder="(11) 4000-0000"
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalEscola(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white cursor-pointer shadow-sm"
                >
                  Salvar Escola
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Produto */}
      {modalProduto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Cadastrar Produto</h3>
              <button
                onClick={() => setModalProduto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {erro}
              </div>
            )}

            <form onSubmit={handleCriarProduto} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  required
                  value={pNome}
                  onChange={(e) => setPNome(e.target.value)}
                  placeholder="Ex: Caderno Universitário 96fls"
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={pCategoria}
                    onChange={(e) => setPCategoria(e.target.value as any)}
                    className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-purple-600"
                  >
                    <option value="alimento">Alimento</option>
                    <option value="limpeza">Limpeza</option>
                    <option value="higiene">Higiene</option>
                    <option value="material">Material</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidade
                  </label>
                  <input
                    type="text"
                    required
                    value={pUnidade}
                    onChange={(e) => setPUnidade(e.target.value)}
                    placeholder="un, cx, kg, pct"
                    className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preço Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={pPreco}
                    onChange={(e) => setPPreco(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-300 p-2.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={pEstoqueMin}
                    onChange={(e) => setPEstoqueMin(Number(e.target.value))}
                    className="w-full rounded-xl bg-white border border-slate-300 p-2.5 font-mono text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={pDescricao}
                  onChange={(e) => setPDescricao(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalProduto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white cursor-pointer shadow-sm"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Fornecedor */}
      {modalFornecedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Cadastrar Fornecedor</h3>
              <button
                onClick={() => setModalFornecedor(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erro && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {erro}
              </div>
            )}

            <form onSubmit={handleCriarFornecedor} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razão Social / Nome Fantasia
                </label>
                <input
                  type="text"
                  required
                  value={fNome}
                  onChange={(e) => setFNome(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={fCnpj}
                  onChange={(e) => setFCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pessoa de Contato
                </label>
                <input
                  type="text"
                  value={fContato}
                  onChange={(e) => setFContato(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={fTelefone}
                  onChange={(e) => setFTelefone(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalFornecedor(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white cursor-pointer shadow-sm"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
