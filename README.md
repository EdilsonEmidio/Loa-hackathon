# Secretaria de Educação — Gestão de Pedidos & Estoque Escolar

Versão **100% Frontend (Static Export)** com persistência local em `localStorage`, pronta para publicação no **GitHub Pages** na branch `v-page`.

## Tecnologias Mantidas

- **Next.js 16** (App Router com `output: "export"`)
- **React 19** & **TypeScript**
- **Tailwind CSS 4**
- **Lucide React**
- **ExcelJS** (importação de planilhas `.xlsx` e exportação de relatórios diretamente no navegador)

## Funcionalidades Disponíveis (Modo Frontend + `localStorage`)

- **Autenticação por Perfil (Demo):** Administrador, Secretaria e Unidades Escolares (com senha padrão `123456`).
- **Portal da Escola:** Criação de pedidos com catálogo, acompanhamento de status, cancelamento e controle de estoque por lote com baixa por consumo.
- **Portal da Secretaria:** Tramitação completa de pedidos (`em_analise` → `confirmado` → `em_preparo` → `entregue` / `cancelado`), designação de fornecedores, registro de validades na entrega, importação e exportação `.xlsx`, e auditoria/baixa central de estoques.
- **Administração Geral:** Cadastro de usuários, escolas, produtos e fornecedores.
- **Alertas Automáticos:** Avisos em tempo real de estoque abaixo do mínimo e lotes próximos ao vencimento (14 dias).
- **Reset de Demonstração:** Botão na barra superior e na tela de login para restaurar os dados iniciais de demonstração.

## Desenvolvimento Local

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Build Estático e Deploy no GitHub Pages

```bash
npm run build
```

A saída estática é gerada na pasta `out/` com `basePath: "/Loa-hackathon"` em produção e workflow automático configurado em `.github/workflows/deploy.yml` para a branch `v-page`.
