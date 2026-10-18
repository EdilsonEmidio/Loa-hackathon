import {
  pgSchema,
  integer,
  text,
  numeric,
  date,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const secEducacao = pgSchema("secretaria_educacao");

// Enums
export const papelUsuarioEnum = secEducacao.enum("papel_usuario", [
  "administrador",
  "secretaria",
  "escola",
]);

export const categoriaProdutoEnum = secEducacao.enum("categoria_produto", [
  "limpeza",
  "higiene",
  "alimento",
  "material",
  "outros",
]);

export const statusPedidoEnum = secEducacao.enum("status_pedido", [
  "em_analise",
  "confirmado",
  "em_preparo",
  "entregue",
  "cancelado",
]);

export const tipoMovimentacaoEnum = secEducacao.enum("tipo_movimentacao", [
  "entrada",
  "baixa_consumo",
  "baixa_vencido",
  "baixa_perda",
  "ajuste",
]);

// Tabelas
export const escolas = secEducacao.table("escola", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  endereco: text("endereco"),
  telefone: text("telefone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const perfisUsuarios = secEducacao.table("perfil_usuario", {
  idAuth: text("id_auth").primaryKey(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash"),
  nome: text("nome").notNull(),
  papel: papelUsuarioEnum("papel").notNull(),
  idEscola: integer("id_escola").references(() => escolas.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const fornecedores = secEducacao.table("fornecedor", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  cnpj: text("cnpj"),
  contato: text("contato"),
  telefone: text("telefone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const produtos = secEducacao.table("produto", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  categoria: categoriaProdutoEnum("categoria").notNull(),
  unidade: text("unidade").notNull().default("un"),
  preco: numeric("preco", { precision: 10, scale: 2 }).notNull(),
  estoqueMinimo: integer("estoque_minimo").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pedidos = secEducacao.table(
  "pedido",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    idEscola: integer("id_escola")
      .notNull()
      .references(() => escolas.id),
    idUsuarioSolicitante: text("id_usuario_solicitante")
      .notNull()
      .references(() => perfisUsuarios.idAuth),
    status: statusPedidoEnum("status").notNull().default("em_analise"),
    dataSolicitacao: timestamp("data_solicitacao", { withTimezone: true })
      .defaultNow()
      .notNull(),
    dataPrevistaEntrega: date("data_prevista_entrega"),
    dataEntrega: timestamp("data_entrega", { withTimezone: true }),
    observacao: text("observacao"),
    motivoCancelamento: text("motivo_cancelamento"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_pedidos_escola_status").on(table.idEscola, table.status),
    index("idx_pedidos_status").on(table.status),
  ]
);

export const pedidoHistoricoStatus = secEducacao.table("pedido_historico_status", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  idPedido: integer("id_pedido")
    .notNull()
    .references(() => pedidos.id, { onDelete: "cascade" }),
  status: statusPedidoEnum("status").notNull(),
  idUsuario: text("id_usuario")
    .notNull()
    .references(() => perfisUsuarios.idAuth),
  observacao: text("observacao"),
  data: timestamp("data", { withTimezone: true }).defaultNow().notNull(),
});

export const pedidoItens = secEducacao.table(
  "pedido_item",
  {
    idPedido: integer("id_pedido")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    idProduto: integer("id_produto")
      .notNull()
      .references(() => produtos.id),
    idFornecedor: integer("id_fornecedor").references(() => fornecedores.id),
    quantidade: integer("quantidade").notNull(),
    precoUnitario: numeric("preco_unitario", { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.idPedido, table.idProduto] }),
  ]
);

export const estoqueLotes = secEducacao.table(
  "estoque_lote",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    idEscola: integer("id_escola")
      .notNull()
      .references(() => escolas.id),
    idProduto: integer("id_produto")
      .notNull()
      .references(() => produtos.id),
    idPedido: integer("id_pedido").references(() => pedidos.id),
    validade: date("validade"),
    quantidadeAtual: integer("quantidade_atual").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_estoque_escola_produto").on(table.idEscola, table.idProduto),
    index("idx_estoque_validade").on(table.validade),
  ]
);

export const movimentacoesEstoque = secEducacao.table("movimentacao_estoque", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  idEstoqueLote: integer("id_estoque_lote")
    .notNull()
    .references(() => estoqueLotes.id),
  tipo: tipoMovimentacaoEnum("tipo").notNull(),
  quantidade: integer("quantidade").notNull(),
  motivo: text("motivo"),
  idUsuario: text("id_usuario")
    .notNull()
    .references(() => perfisUsuarios.idAuth),
  data: timestamp("data", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const escolasRelations = relations(escolas, ({ many }) => ({
  usuarios: many(perfisUsuarios),
  pedidos: many(pedidos),
  lotes: many(estoqueLotes),
}));

export const perfisUsuariosRelations = relations(perfisUsuarios, ({ one, many }) => ({
  escola: one(escolas, {
    fields: [perfisUsuarios.idEscola],
    references: [escolas.id],
  }),
  pedidosSolicitados: many(pedidos),
  historicosStatus: many(pedidoHistoricoStatus),
  movimentacoes: many(movimentacoesEstoque),
}));

export const produtosRelations = relations(produtos, ({ many }) => ({
  pedidoItens: many(pedidoItens),
  estoqueLotes: many(estoqueLotes),
}));

export const pedidosRelations = relations(pedidos, ({ one, many }) => ({
  escola: one(escolas, {
    fields: [pedidos.idEscola],
    references: [escolas.id],
  }),
  solicitante: one(perfisUsuarios, {
    fields: [pedidos.idUsuarioSolicitante],
    references: [perfisUsuarios.idAuth],
  }),
  itens: many(pedidoItens),
  historico: many(pedidoHistoricoStatus),
}));

export const pedidoItensRelations = relations(pedidoItens, ({ one }) => ({
  pedido: one(pedidos, {
    fields: [pedidoItens.idPedido],
    references: [pedidos.id],
  }),
  produto: one(produtos, {
    fields: [pedidoItens.idProduto],
    references: [produtos.id],
  }),
  fornecedor: one(fornecedores, {
    fields: [pedidoItens.idFornecedor],
    references: [fornecedores.id],
  }),
}));

export const estoqueLotesRelations = relations(estoqueLotes, ({ one, many }) => ({
  escola: one(escolas, {
    fields: [estoqueLotes.idEscola],
    references: [escolas.id],
  }),
  produto: one(produtos, {
    fields: [estoqueLotes.idProduto],
    references: [produtos.id],
  }),
  pedido: one(pedidos, {
    fields: [estoqueLotes.idPedido],
    references: [pedidos.id],
  }),
  movimentacoes: many(movimentacoesEstoque),
}));

export const movimentacoesEstoqueRelations = relations(movimentacoesEstoque, ({ one }) => ({
  lote: one(estoqueLotes, {
    fields: [movimentacoesEstoque.idEstoqueLote],
    references: [estoqueLotes.id],
  }),
  usuario: one(perfisUsuarios, {
    fields: [movimentacoesEstoque.idUsuario],
    references: [perfisUsuarios.idAuth],
  }),
}));
