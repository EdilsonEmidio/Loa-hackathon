"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { createInitialDatabase } from "@/lib/seed-data";
import type {
  AppDatabase,
  CategoriaProduto,
  Escola,
  Fornecedor,
  PapelUsuario,
  PerfilUsuario,
  Produto,
  TipoMovimentacao,
  UserSession,
} from "@/lib/types";
import type { ProdutoImportadoInput } from "@/lib/excel";

const DB_STORAGE_KEY = "gestao_escolar_db_v1";
const SESSION_STORAGE_KEY = "gestao_escolar_session_v1";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface ItemPedidoInput {
  idProduto: number;
  quantidade: number;
}

export interface DarBaixaInput {
  idEstoqueLote: number;
  quantidade: number;
  tipo: Exclude<TipoMovimentacao, "entrada">;
  motivo?: string;
}

interface StoreSnapshot {
  db: AppDatabase;
  sessionIdAuth: string | null;
}

interface AppStoreContextValue {
  db: AppDatabase;
  session: UserSession | null;
  isHydrated: boolean;
  login: (email: string, senha: string) => ActionResult<UserSession>;
  logout: () => void;
  resetDemoData: () => void;
  criarEscola: (
    nome: string,
    endereco?: string,
    telefone?: string
  ) => ActionResult<Escola>;
  criarUsuario: (
    nome: string,
    email: string,
    senhaPlana: string,
    papel: PapelUsuario,
    idEscola?: number | null
  ) => ActionResult<PerfilUsuario>;
  criarProduto: (
    nome: string,
    categoria: CategoriaProduto,
    unidade: string,
    preco: number,
    estoqueMinimo: number,
    descricao?: string
  ) => ActionResult<Produto>;
  importarProdutosEmLote: (
    produtosList: ProdutoImportadoInput[]
  ) => ActionResult<{ importados: number }>;
  criarFornecedor: (
    nome: string,
    cnpj?: string,
    contato?: string,
    telefone?: string
  ) => ActionResult<Fornecedor>;
  criarPedido: (
    itens: ItemPedidoInput[],
    observacao?: string
  ) => ActionResult<{ idPedido: number }>;
  cancelarPedido: (idPedido: number, motivo: string) => ActionResult;
  confirmarPedido: (idPedido: number) => ActionResult;
  iniciarPreparo: (
    idPedido: number,
    dataPrevistaEntrega: string,
    fornecedorPorItem?: Record<number, number>
  ) => ActionResult;
  marcarEntregue: (
    idPedido: number,
    validadesPorItem: Record<number, string>
  ) => ActionResult;
  darBaixaEstoque: (input: DarBaixaInput) => ActionResult;
}

const SERVER_SNAPSHOT: StoreSnapshot = {
  db: createInitialDatabase(),
  sessionIdAuth: null,
};

let clientSnapshot: StoreSnapshot | null = null;
const listeners = new Set<() => void>();

function loadClientSnapshot(): StoreSnapshot {
  if (clientSnapshot) return clientSnapshot;

  let db = createInitialDatabase();
  let sessionIdAuth: string | null = null;

  try {
    const rawDb = window.localStorage.getItem(DB_STORAGE_KEY);
    if (rawDb) {
      const parsed = JSON.parse(rawDb) as AppDatabase;
      if (
        parsed &&
        Array.isArray(parsed.escolas) &&
        Array.isArray(parsed.perfisUsuarios)
      ) {
        db = parsed;
      }
    } else {
      window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    }

    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (rawSession) {
      sessionIdAuth = rawSession;
    }
  } catch {
    // Mantém dados iniciais em memória caso localStorage não esteja acessível
  }

  clientSnapshot = { db, sessionIdAuth };
  return clientSnapshot;
}

function getClientSnapshot(): StoreSnapshot {
  return loadClientSnapshot();
}

function getServerSnapshot(): StoreSnapshot {
  return SERVER_SNAPSHOT;
}

function subscribeStore(listener: () => void): () => void {
  listeners.add(listener);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === DB_STORAGE_KEY || e.key === SESSION_STORAGE_KEY) {
      clientSnapshot = null;
      loadClientSnapshot();
      listeners.forEach((l) => l());
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function updateStore(updater: (prev: StoreSnapshot) => StoreSnapshot) {
  const prev = loadClientSnapshot();
  const next = updater(prev);
  clientSnapshot = next;

  try {
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(next.db));
    if (next.sessionIdAuth) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, next.sessionIdAuth);
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignora falha de quota
  }

  listeners.forEach((l) => l());
}

const emptySubscribe = () => () => {};

function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeStore,
    getClientSnapshot,
    getServerSnapshot
  );

  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const { db, sessionIdAuth } = snapshot;

  const session: UserSession | null = useMemo(() => {
    if (!sessionIdAuth) return null;
    const usuario = db.perfisUsuarios.find((u) => u.idAuth === sessionIdAuth);
    if (!usuario) return null;
    const escola = usuario.idEscola
      ? db.escolas.find((e) => e.id === usuario.idEscola)
      : undefined;

    return {
      idAuth: usuario.idAuth,
      email: usuario.email,
      nome: usuario.nome,
      papel: usuario.papel,
      idEscola: usuario.idEscola,
      nomeEscola: escola?.nome ?? null,
    };
  }, [db.perfisUsuarios, db.escolas, sessionIdAuth]);

  const login = (email: string, senha: string): ActionResult<UserSession> => {
    if (!email || !senha) {
      return { success: false, error: "Por favor, preencha email e senha." };
    }

    const current = loadClientSnapshot();
    const emailNorm = email.trim().toLowerCase();
    const usuario = current.db.perfisUsuarios.find(
      (u) => u.email.toLowerCase() === emailNorm
    );

    if (!usuario || usuario.senha !== senha) {
      return { success: false, error: "Email ou senha incorretos." };
    }

    const escola = usuario.idEscola
      ? current.db.escolas.find((e) => e.id === usuario.idEscola)
      : undefined;

    const userSession: UserSession = {
      idAuth: usuario.idAuth,
      email: usuario.email,
      nome: usuario.nome,
      papel: usuario.papel,
      idEscola: usuario.idEscola,
      nomeEscola: escola?.nome ?? null,
    };

    updateStore((prev) => ({
      ...prev,
      sessionIdAuth: usuario.idAuth,
    }));

    return { success: true, data: userSession };
  };

  const logout = () => {
    updateStore((prev) => ({
      ...prev,
      sessionIdAuth: null,
    }));
  };

  const resetDemoData = () => {
    const fresh = createInitialDatabase();
    updateStore((prev) => ({
      db: fresh,
      sessionIdAuth:
        prev.sessionIdAuth &&
        fresh.perfisUsuarios.some((u) => u.idAuth === prev.sessionIdAuth)
          ? prev.sessionIdAuth
          : null,
    }));
  };

  const criarEscola = (
    nome: string,
    endereco?: string,
    telefone?: string
  ): ActionResult<Escola> => {
    if (!session || session.papel !== "administrador") {
      return {
        success: false,
        error: "Apenas administradores podem cadastrar escolas.",
      };
    }

    if (!nome || !nome.trim()) {
      return { success: false, error: "O nome da escola é obrigatório." };
    }

    const nova: Escola = {
      id: nextId(db.escolas),
      nome: nome.trim(),
      endereco: endereco?.trim() || null,
      telefone: telefone?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    updateStore((prev) => ({
      ...prev,
      db: {
        ...prev.db,
        escolas: [...prev.db.escolas, nova],
      },
    }));

    return { success: true, data: nova };
  };

  const criarUsuario = (
    nome: string,
    email: string,
    senhaPlana: string,
    papel: PapelUsuario,
    idEscola?: number | null
  ): ActionResult<PerfilUsuario> => {
    if (!session || session.papel !== "administrador") {
      return {
        success: false,
        error: "Apenas administradores podem cadastrar usuários.",
      };
    }

    if (!nome || !email || !senhaPlana) {
      return {
        success: false,
        error: "Nome, e-mail e senha são obrigatórios.",
      };
    }

    if (papel === "escola" && !idEscola) {
      return {
        success: false,
        error: "Usuários do tipo escola devem estar vinculados a uma unidade.",
      };
    }

    const emailNorm = email.trim().toLowerCase();
    if (db.perfisUsuarios.some((u) => u.email.toLowerCase() === emailNorm)) {
      return {
        success: false,
        error: "Já existe um usuário cadastrado com este e-mail.",
      };
    }

    const novo: PerfilUsuario = {
      idAuth: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nome: nome.trim(),
      email: emailNorm,
      senha: senhaPlana,
      papel,
      idEscola: papel === "escola" ? idEscola ?? null : null,
      createdAt: new Date().toISOString(),
    };

    updateStore((prev) => ({
      ...prev,
      db: {
        ...prev.db,
        perfisUsuarios: [...prev.db.perfisUsuarios, novo],
      },
    }));

    return { success: true, data: novo };
  };

  const criarProduto = (
    nome: string,
    categoria: CategoriaProduto,
    unidade: string,
    preco: number,
    estoqueMinimo: number,
    descricao?: string
  ): ActionResult<Produto> => {
    if (
      !session ||
      (session.papel !== "administrador" && session.papel !== "secretaria")
    ) {
      return { success: false, error: "Permissão insuficiente." };
    }

    if (!nome || preco <= 0) {
      return {
        success: false,
        error: "Nome e preço válido são obrigatórios.",
      };
    }

    const novo: Produto = {
      id: nextId(db.produtos),
      nome: nome.trim(),
      categoria,
      unidade: unidade.trim() || "un",
      preco: preco.toFixed(2),
      estoqueMinimo: estoqueMinimo || 10,
      descricao: descricao?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    updateStore((prev) => ({
      ...prev,
      db: {
        ...prev.db,
        produtos: [...prev.db.produtos, novo],
      },
    }));

    return { success: true, data: novo };
  };

  const importarProdutosEmLote = (
    produtosList: ProdutoImportadoInput[]
  ): ActionResult<{ importados: number }> => {
    if (
      !session ||
      (session.papel !== "secretaria" && session.papel !== "administrador")
    ) {
      return { success: false, error: "Não autorizado" };
    }

    const nowIso = new Date().toISOString();

    updateStore((prev) => {
      let currentMaxId = nextId(prev.db.produtos) - 1;
      const novos: Produto[] = produtosList.map((p) => {
        currentMaxId += 1;
        return {
          id: currentMaxId,
          nome: p.nome.trim(),
          categoria: p.categoria,
          unidade: p.unidade.trim() || "un",
          preco: p.preco.toFixed(2),
          estoqueMinimo: p.estoqueMinimo || 10,
          descricao: p.descricao?.trim() || null,
          createdAt: nowIso,
        };
      });

      return {
        ...prev,
        db: {
          ...prev.db,
          produtos: [...prev.db.produtos, ...novos],
        },
      };
    });

    return { success: true, data: { importados: produtosList.length } };
  };

  const criarFornecedor = (
    nome: string,
    cnpj?: string,
    contato?: string,
    telefone?: string
  ): ActionResult<Fornecedor> => {
    if (!session || session.papel !== "administrador") {
      return {
        success: false,
        error: "Apenas administradores podem cadastrar fornecedores.",
      };
    }

    if (!nome || !nome.trim()) {
      return { success: false, error: "O nome do fornecedor é obrigatório." };
    }

    const novo: Fornecedor = {
      id: nextId(db.fornecedores),
      nome: nome.trim(),
      cnpj: cnpj?.trim() || null,
      contato: contato?.trim() || null,
      telefone: telefone?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    updateStore((prev) => ({
      ...prev,
      db: {
        ...prev.db,
        fornecedores: [...prev.db.fornecedores, novo],
      },
    }));

    return { success: true, data: novo };
  };

  const criarPedido = (
    itens: ItemPedidoInput[],
    observacao?: string
  ): ActionResult<{ idPedido: number }> => {
    if (!session) {
      return { success: false, error: "Não autenticado." };
    }

    if (session.papel !== "escola" && session.papel !== "administrador") {
      return {
        success: false,
        error: "Apenas escolas ou administradores podem emitir novos pedidos.",
      };
    }

    if (!itens || itens.length === 0) {
      return {
        success: false,
        error: "O pedido precisa conter ao menos um item.",
      };
    }

    const idEscola = session.idEscola || 1;
    const nowIso = new Date().toISOString();
    const idPedido = nextId(db.pedidos);

    const novosItens = itens
      .filter((it) => it.quantidade > 0)
      .map((it) => {
        const prod = db.produtos.find((p) => p.id === it.idProduto);
        if (!prod) return null;
        return {
          idPedido,
          idProduto: it.idProduto,
          idFornecedor: null,
          quantidade: it.quantidade,
          precoUnitario: prod.preco,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (novosItens.length === 0) {
      return {
        success: false,
        error: "Nenhum produto válido selecionado.",
      };
    }

    updateStore((prev) => ({
      ...prev,
      db: {
        ...prev.db,
        pedidos: [
          ...prev.db.pedidos,
          {
            id: idPedido,
            idEscola,
            idUsuarioSolicitante: session.idAuth,
            status: "em_analise",
            dataSolicitacao: nowIso,
            dataPrevistaEntrega: null,
            dataEntrega: null,
            observacao: observacao?.trim() || null,
            motivoCancelamento: null,
            createdAt: nowIso,
          },
        ],
        pedidoItens: [...prev.db.pedidoItens, ...novosItens],
        pedidoHistoricoStatus: [
          ...prev.db.pedidoHistoricoStatus,
          {
            id: nextId(prev.db.pedidoHistoricoStatus),
            idPedido,
            status: "em_analise",
            idUsuario: session.idAuth,
            observacao: "Pedido criado e submetido para análise",
            data: nowIso,
          },
        ],
      },
    }));

    return { success: true, data: { idPedido } };
  };

  const cancelarPedido = (idPedido: number, motivo: string): ActionResult => {
    if (!session) return { success: false, error: "Não autenticado." };

    if (!motivo || motivo.trim().length === 0) {
      return {
        success: false,
        error: "O motivo do cancelamento é obrigatório.",
      };
    }

    const pedido = db.pedidos.find((p) => p.id === idPedido);
    if (!pedido) {
      return { success: false, error: "Pedido não encontrado." };
    }

    if (pedido.status === "entregue") {
      return {
        success: false,
        error: "Pedidos já entregues não podem ser cancelados.",
      };
    }

    if (pedido.status === "cancelado") {
      return { success: false, error: "Este pedido já foi cancelado." };
    }

    if (session.papel === "escola") {
      if (pedido.idEscola !== session.idEscola) {
        return {
          success: false,
          error: "Você não tem permissão para cancelar pedidos de outra escola.",
        };
      }
      if (pedido.status !== "em_analise") {
        return {
          success: false,
          error:
            "A escola só pode cancelar pedidos enquanto estiverem em análise.",
        };
      }
    }

    const nowIso = new Date().toISOString();
    updateStore((prev) => ({
      ...prev,
      db: {
        ...prev.db,
        pedidos: prev.db.pedidos.map((p) =>
          p.id === idPedido
            ? { ...p, status: "cancelado", motivoCancelamento: motivo.trim() }
            : p
        ),
        pedidoHistoricoStatus: [
          ...prev.db.pedidoHistoricoStatus,
          {
            id: nextId(prev.db.pedidoHistoricoStatus),
            idPedido,
            status: "cancelado",
            idUsuario: session.idAuth,
            observacao: `Cancelado por ${session.nome}: ${motivo.trim()}`,
            data: nowIso,
          },
        ],
      },
    }));

    return { success: true };
  };

  const confirmarPedido = (idPedido: number): ActionResult => {
    if (
      !session ||
      (session.papel !== "secretaria" && session.papel !== "administrador")
    ) {
      return {
        success: false,
        error: "Apenas a secretaria pode confirmar pedidos.",
      };
    }

    const pedido = db.pedidos.find((p) => p.id === idPedido);
    if (!pedido || pedido.status !== "em_analise") {
      return {
        success: false,
        error: "O pedido precisa estar em análise para ser confirmado.",
      };
    }

    const nowIso = new Date().toISOString();
    updateStore((prev) => ({
      ...prev,
      db: {
        ...prev.db,
        pedidos: prev.db.pedidos.map((p) =>
          p.id === idPedido && p.status === "em_analise"
            ? { ...p, status: "confirmado" }
            : p
        ),
        pedidoHistoricoStatus: [
          ...prev.db.pedidoHistoricoStatus,
          {
            id: nextId(prev.db.pedidoHistoricoStatus),
            idPedido,
            status: "confirmado",
            idUsuario: session.idAuth,
            observacao: "Pedido aprovado pela Secretaria de Educação",
            data: nowIso,
          },
        ],
      },
    }));

    return { success: true };
  };

  const iniciarPreparo = (
    idPedido: number,
    dataPrevistaEntrega: string,
    fornecedorPorItem?: Record<number, number>
  ): ActionResult => {
    if (
      !session ||
      (session.papel !== "secretaria" && session.papel !== "administrador")
    ) {
      return {
        success: false,
        error: "Apenas a secretaria pode iniciar preparo de pedidos.",
      };
    }

    if (!dataPrevistaEntrega) {
      return {
        success: false,
        error: "A data prevista de entrega é obrigatória.",
      };
    }

    const nowIso = new Date().toISOString();
    updateStore((prev) => ({
      ...prev,
      db: {
        ...prev.db,
        pedidos: prev.db.pedidos.map((p) =>
          p.id === idPedido
            ? { ...p, status: "em_preparo", dataPrevistaEntrega }
            : p
        ),
        pedidoItens: prev.db.pedidoItens.map((it) => {
          if (it.idPedido !== idPedido || !fornecedorPorItem) return it;
          const idFornecedor = fornecedorPorItem[it.idProduto];
          return idFornecedor ? { ...it, idFornecedor } : it;
        }),
        pedidoHistoricoStatus: [
          ...prev.db.pedidoHistoricoStatus,
          {
            id: nextId(prev.db.pedidoHistoricoStatus),
            idPedido,
            status: "em_preparo",
            idUsuario: session.idAuth,
            observacao: `Entrou em preparo. Entrega estimada para ${dataPrevistaEntrega}`,
            data: nowIso,
          },
        ],
      },
    }));

    return { success: true };
  };

  const marcarEntregue = (
    idPedido: number,
    validadesPorItem: Record<number, string>
  ): ActionResult => {
    if (
      !session ||
      (session.papel !== "secretaria" && session.papel !== "administrador")
    ) {
      return {
        success: false,
        error: "Apenas a secretaria pode confirmar entrega.",
      };
    }

    const pedido = db.pedidos.find((p) => p.id === idPedido);
    if (!pedido) {
      return { success: false, error: "Pedido não encontrado." };
    }
    if (pedido.status === "entregue") {
      return {
        success: false,
        error: "Este pedido já foi marcado como entregue.",
      };
    }

    const nowIso = new Date().toISOString();
    const itensDoPedido = db.pedidoItens.filter(
      (it) => it.idPedido === idPedido
    );

    updateStore((prev) => {
      let currentLoteId = nextId(prev.db.estoqueLotes) - 1;
      let currentMovId = nextId(prev.db.movimentacoesEstoque) - 1;
      const novosLotes = [];
      const novasMovs = [];

      for (const item of itensDoPedido) {
        currentLoteId += 1;
        currentMovId += 1;
        const validade = validadesPorItem[item.idProduto] || null;

        novosLotes.push({
          id: currentLoteId,
          idEscola: pedido.idEscola,
          idProduto: item.idProduto,
          idPedido,
          validade,
          quantidadeAtual: item.quantidade,
          createdAt: nowIso,
        });

        novasMovs.push({
          id: currentMovId,
          idEstoqueLote: currentLoteId,
          tipo: "entrada" as const,
          quantidade: item.quantidade,
          motivo: `Recebimento de entrega do pedido #${idPedido}`,
          idUsuario: session.idAuth,
          data: nowIso,
        });
      }

      return {
        ...prev,
        db: {
          ...prev.db,
          pedidos: prev.db.pedidos.map((p) =>
            p.id === idPedido
              ? { ...p, status: "entregue", dataEntrega: nowIso }
              : p
          ),
          estoqueLotes: [...prev.db.estoqueLotes, ...novosLotes],
          movimentacoesEstoque: [...prev.db.movimentacoesEstoque, ...novasMovs],
          pedidoHistoricoStatus: [
            ...prev.db.pedidoHistoricoStatus,
            {
              id: nextId(prev.db.pedidoHistoricoStatus),
              idPedido,
              status: "entregue",
              idUsuario: session.idAuth,
              observacao:
                "Produtos conferidos e incorporados ao estoque da escola",
              data: nowIso,
            },
          ],
        },
      };
    });

    return { success: true };
  };

  const darBaixaEstoque = (input: DarBaixaInput): ActionResult => {
    if (!session) {
      return { success: false, error: "Não autenticado." };
    }

    if (input.quantidade <= 0) {
      return {
        success: false,
        error: "A quantidade para baixa deve ser maior que zero.",
      };
    }

    if (session.papel === "escola" && input.tipo !== "baixa_consumo") {
      return {
        success: false,
        error: "A escola só pode registrar baixas por consumo.",
      };
    }

    const lote = db.estoqueLotes.find((l) => l.id === input.idEstoqueLote);
    if (!lote) {
      return { success: false, error: "Lote de estoque não encontrado." };
    }

    if (session.papel === "escola" && session.idEscola !== lote.idEscola) {
      return {
        success: false,
        error:
          "Você não tem autorização para dar baixa no estoque de outra unidade.",
      };
    }

    if (lote.quantidadeAtual < input.quantidade) {
      return {
        success: false,
        error: `Saldo insuficiente no lote. Disponível: ${lote.quantidadeAtual}, solicitado: ${input.quantidade}`,
      };
    }

    const nowIso = new Date().toISOString();
    updateStore((prev) => ({
      ...prev,
      db: {
        ...prev.db,
        estoqueLotes: prev.db.estoqueLotes.map((l) =>
          l.id === input.idEstoqueLote
            ? { ...l, quantidadeAtual: l.quantidadeAtual - input.quantidade }
            : l
        ),
        movimentacoesEstoque: [
          ...prev.db.movimentacoesEstoque,
          {
            id: nextId(prev.db.movimentacoesEstoque),
            idEstoqueLote: input.idEstoqueLote,
            tipo: input.tipo,
            quantidade: input.quantidade,
            motivo: input.motivo || `Baixa registrada por ${session.nome}`,
            idUsuario: session.idAuth,
            data: nowIso,
          },
        ],
      },
    }));

    return { success: true };
  };

  return (
    <AppStoreContext.Provider
      value={{
        db,
        session,
        isHydrated,
        login,
        logout,
        resetDemoData,
        criarEscola,
        criarUsuario,
        criarProduto,
        importarProdutosEmLote,
        criarFornecedor,
        criarPedido,
        cancelarPedido,
        confirmarPedido,
        iniciarPreparo,
        marcarEntregue,
        darBaixaEstoque,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error("useAppStore deve ser usado dentro de AppStoreProvider.");
  }
  return ctx;
}
