export type PapelUsuario = "administrador" | "secretaria" | "escola";

export type CategoriaProduto =
  | "limpeza"
  | "higiene"
  | "alimento"
  | "material"
  | "outros";

export type StatusPedido =
  | "em_analise"
  | "confirmado"
  | "em_preparo"
  | "entregue"
  | "cancelado";

export type TipoMovimentacao =
  | "entrada"
  | "baixa_consumo"
  | "baixa_vencido"
  | "baixa_perda"
  | "ajuste";

export interface Escola {
  id: number;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  createdAt: string;
}

export interface PerfilUsuario {
  idAuth: string;
  email: string;
  senha: string;
  nome: string;
  papel: PapelUsuario;
  idEscola: number | null;
  createdAt: string;
}

export interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string | null;
  contato: string | null;
  telefone: string | null;
  createdAt: string;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: CategoriaProduto;
  unidade: string;
  preco: string;
  estoqueMinimo: number;
  createdAt: string;
}

export interface Pedido {
  id: number;
  idEscola: number;
  idUsuarioSolicitante: string;
  status: StatusPedido;
  dataSolicitacao: string;
  dataPrevistaEntrega: string | null;
  dataEntrega: string | null;
  observacao: string | null;
  motivoCancelamento: string | null;
  createdAt: string;
}

export interface PedidoItem {
  idPedido: number;
  idProduto: number;
  idFornecedor: number | null;
  quantidade: number;
  precoUnitario: string;
}

export interface PedidoHistoricoStatus {
  id: number;
  idPedido: number;
  status: StatusPedido;
  idUsuario: string;
  observacao: string | null;
  data: string;
}

export interface EstoqueLote {
  id: number;
  idEscola: number;
  idProduto: number;
  idPedido: number | null;
  validade: string | null;
  quantidadeAtual: number;
  createdAt: string;
}

export interface MovimentacaoEstoque {
  id: number;
  idEstoqueLote: number;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo: string | null;
  idUsuario: string;
  data: string;
}

export interface UserSession {
  idAuth: string;
  email: string;
  nome: string;
  papel: PapelUsuario;
  idEscola: number | null;
  nomeEscola?: string | null;
}

export interface AlertaItem {
  tipo: "estoque_baixo" | "validade_proxima";
  idEscola: number;
  nomeEscola: string;
  idProduto: number;
  nomeProduto: string;
  detalhe: string;
  quantidadeAtual: number;
  estoqueMinimo?: number;
  validade?: string | null;
}

export interface AppDatabase {
  escolas: Escola[];
  perfisUsuarios: PerfilUsuario[];
  fornecedores: Fornecedor[];
  produtos: Produto[];
  pedidos: Pedido[];
  pedidoItens: PedidoItem[];
  pedidoHistoricoStatus: PedidoHistoricoStatus[];
  estoqueLotes: EstoqueLote[];
  movimentacoesEstoque: MovimentacaoEstoque[];
}
