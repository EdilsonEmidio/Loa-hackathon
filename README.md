# Secretaria de Educação — Gestão de Pedidos & Estoque Escolar

Sistema Integrado de Pedidos e Controle de Estoques para Unidades Escolares da Rede Municipal.

## Estrutura de Branches

Este repositório mantém duas versões do projeto em branches separadas:

- **`main` (Ideia Original Fullstack):** aplicação completa com conexão a backend utilizando Next.js App Router (Server Actions e API Routes), banco de dados PostgreSQL (Neon), Drizzle ORM, autenticação com hash `bcryptjs` e sessões via cookie JWT (`jose`).
- **`v-page` (Branch Atual — Apenas Frontend / GitHub Pages):** versão adaptada para rodar **100% no navegador (Static Export)** sem conexão com backend, utilizando persistência em `localStorage` com dados de demonstração pré-carregados e deploy automático no GitHub Pages em `/Loa-hackathon`.

---

## Sobre a Versão `v-page` (Frontend Estático)

### Tecnologias Mantidas

- **Next.js 16** (App Router com `output: "export"`)
- **React 19** & **TypeScript**
- **Tailwind CSS 4**
- **Lucide React**
- **ExcelJS** (importação de planilhas `.xlsx` e exportação de relatórios diretamente no navegador)

### Funcionalidades Disponíveis (Frontend + `localStorage`)

- **Autenticação por Perfil (Demonstração):** Administrador, Secretaria e Unidades Escolares (senha padrão `123456`).
- **Portal da Escola:** criação de pedidos a partir do catálogo, acompanhamento de status, cancelamento e controle de estoque por lote com baixa por consumo.
- **Portal da Secretaria:** tramitação completa de pedidos (`em_analise` → `confirmado` → `em_preparo` → `entregue` / `cancelado`), designação de fornecedores, registro de validades na entrega, importação/exportação `.xlsx` e auditoria/baixa central de estoques.
- **Administração Geral:** cadastro de usuários, escolas, produtos e fornecedores.
- **Alertas Automáticos:** avisos em tempo real de estoque abaixo do mínimo e lotes próximos ao vencimento (14 dias).
- **Reset de Demonstração:** botão na barra superior e na tela de login para restaurar os dados iniciais no navegador.

- Para ver a pagina -> https://edilsonemidio.github.io/Loa-hackathon/secretaria/

### Desenvolvimento Local

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Build Estático e Deploy no GitHub Pages

```bash
npm run build
```

A saída estática é gerada na pasta `out/` com `basePath: "/Loa-hackathon"` em produção e workflow automático configurado em `.github/workflows/deploy.yml` para a branch `v-page`.
