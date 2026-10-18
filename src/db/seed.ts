import { config } from "dotenv";
config();

import bcrypt from "bcryptjs";
import { db } from "./client";
import {
  escolas,
  perfisUsuarios,
  fornecedores,
  produtos,
} from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Iniciando seed no Neon Postgres...");

  // 1. Escolas
  const escolasExistentes = await db.select().from(escolas);
  let idEscola1: number;
  let idEscola2: number;

  if (escolasExistentes.length === 0) {
    const [e1] = await db
      .insert(escolas)
      .values({
        nome: "E.M. Monteiro Lobato",
        endereco: "Rua das Flores, 120 - Centro",
        telefone: "(11) 4002-8922",
      })
      .returning();

    const [e2] = await db
      .insert(escolas)
      .values({
        nome: "E.M. Cecília Meireles",
        endereco: "Av. dos Estudantes, 450 - Jd. Primavera",
        telefone: "(11) 4002-8923",
      })
      .returning();

    idEscola1 = e1.id;
    idEscola2 = e2.id;
    console.log("✓ Escolas criadas");
  } else {
    idEscola1 = escolasExistentes[0].id;
    idEscola2 = escolasExistentes[1]?.id ?? escolasExistentes[0].id;
    console.log("✓ Escolas já existentes");
  }

  // 2. Fornecedores
  const fornecedoresExistentes = await db.select().from(fornecedores);
  if (fornecedoresExistentes.length === 0) {
    await db.insert(fornecedores).values([
      {
        nome: "Distribuidora Central de Alimentos & Higiene",
        cnpj: "12.345.678/0001-90",
        contato: "Carlos Vendas",
        telefone: "(11) 3333-1111",
      },
      {
        nome: "Comercial Papel & Cia Materiais Pedagógicos",
        cnpj: "98.765.432/0001-11",
        contato: "Mariana Suprimentos",
        telefone: "(11) 3333-2222",
      },
    ]);
    console.log("✓ Fornecedores criados");
  } else {
    console.log("✓ Fornecedores já existentes");
  }

  // 3. Usuários
  const senhaPadrao = await bcrypt.hash("123456", 10);

  const usuariosMock = [
    {
      idAuth: "usr-admin-1",
      email: "admin@educacao.gov.br",
      nome: "Edilson Administrador",
      papel: "administrador" as const,
      senhaHash: senhaPadrao,
      idEscola: null,
    },
    {
      idAuth: "usr-sec-1",
      email: "secretaria@educacao.gov.br",
      nome: "Regina Coordenadora",
      papel: "secretaria" as const,
      senhaHash: senhaPadrao,
      idEscola: null,
    },
    {
      idAuth: "usr-esc-1",
      email: "escola.monteiro@educacao.gov.br",
      nome: "Diretora Lúcia (Monteiro Lobato)",
      papel: "escola" as const,
      senhaHash: senhaPadrao,
      idEscola: idEscola1,
    },
    {
      idAuth: "usr-esc-2",
      email: "escola.cecilia@educacao.gov.br",
      nome: "Diretor Marcos (Cecília Meireles)",
      papel: "escola" as const,
      senhaHash: senhaPadrao,
      idEscola: idEscola2,
    },
  ];

  for (const u of usuariosMock) {
    const existe = await db
      .select()
      .from(perfisUsuarios)
      .where(eq(perfisUsuarios.email, u.email));

    if (existe.length === 0) {
      await db.insert(perfisUsuarios).values(u);
    }
  }
  console.log("✓ Usuários de teste prontos (senha padrão: 123456)");

  // 4. Produtos
  const produtosExistentes = await db.select().from(produtos);
  if (produtosExistentes.length === 0) {
    await db.insert(produtos).values([
      {
        nome: "Arroz Tipo 1 - Pacote 5kg",
        descricao: "Arroz agulhinha longo fino tipo 1",
        categoria: "alimento",
        unidade: "pct",
        preco: "28.90",
        estoqueMinimo: 15,
      },
      {
        nome: "Feijão Carioca - Pacote 1kg",
        descricao: "Feijão carioca classe cores novo",
        categoria: "alimento",
        unidade: "pct",
        preco: "8.50",
        estoqueMinimo: 20,
      },
      {
        nome: "Óleo de Soja Refinado 900ml",
        descricao: "Óleo comestível 100% soja",
        categoria: "alimento",
        unidade: "un",
        preco: "6.90",
        estoqueMinimo: 12,
      },
      {
        nome: "Leite Integral UHT 1L",
        descricao: "Leite longa vida integral",
        categoria: "alimento",
        unidade: "cx",
        preco: "5.40",
        estoqueMinimo: 30,
      },
      {
        nome: "Detergente Neutro 500ml",
        descricao: "Detergente líquido lava-louças biodegradável",
        categoria: "limpeza",
        unidade: "frasco",
        preco: "2.80",
        estoqueMinimo: 25,
      },
      {
        nome: "Desinfetante Uso Geral 5L",
        descricao: "Desinfetante bactericida com fragrância pinho/floral",
        categoria: "limpeza",
        unidade: "gl",
        preco: "22.50",
        estoqueMinimo: 5,
      },
      {
        nome: "Sabonete Líquido Antisséptico 5L",
        descricao: "Sabonete líquido para mãos glicerinado",
        categoria: "higiene",
        unidade: "gl",
        preco: "34.00",
        estoqueMinimo: 4,
      },
      {
        nome: "Papel Higiênico Folha Dupla (Fardo c/ 64)",
        descricao: "Papel higiênico 100% celulose virgem",
        categoria: "higiene",
        unidade: "fardo",
        preco: "78.00",
        estoqueMinimo: 6,
      },
      {
        nome: "Papel Sulfite A4 75g (Caixa c/ 10 resmas)",
        descricao: "Papel branco alcalino para impressoras e cópias",
        categoria: "material",
        unidade: "cx",
        preco: "260.00",
        estoqueMinimo: 4,
      },
      {
        nome: "Caneta Esferográfica Azul (Caixa c/ 50)",
        descricao: "Caneta ponta média 1.0mm escrita macia",
        categoria: "material",
        unidade: "cx",
        preco: "45.00",
        estoqueMinimo: 5,
      },
      {
        nome: "Lápis de Cor 12 Cores (Caixa)",
        descricao: "Lápis de madeira reflorestada mina macia",
        categoria: "material",
        unidade: "cx",
        preco: "7.90",
        estoqueMinimo: 20,
      },
      {
        nome: "Álcool 70% Líquido 1L",
        descricao: "Álcool etílico hidratado 70° INPM",
        categoria: "outros",
        unidade: "frasco",
        preco: "9.20",
        estoqueMinimo: 10,
      },
    ]);
    console.log("✓ Catálogo de produtos cadastrado com sucesso");
  } else {
    console.log("✓ Produtos já cadastrados");
  }

  console.log("Seed finalizado com sucesso!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
