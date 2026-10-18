"use server";

import { db } from "@/db/client";
import { escolas, perfisUsuarios, produtos, fornecedores } from "@/db/schema";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function criarEscolaAction(nome: string, endereco?: string, telefone?: string) {
  const session = await getSession();
  if (!session || session.papel !== "administrador") {
    return { success: false, error: "Apenas administradores podem cadastrar escolas." };
  }

  if (!nome || !nome.trim()) {
    return { success: false, error: "O nome da escola é obrigatório." };
  }

  try {
    const [nova] = await db
      .insert(escolas)
      .values({
        nome: nome.trim(),
        endereco: endereco?.trim() || null,
        telefone: telefone?.trim() || null,
      })
      .returning();

    revalidatePath("/admin");
    revalidatePath("/secretaria");
    return { success: true, escola: nova };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function criarUsuarioAction(
  nome: string,
  email: string,
  senhaPlana: string,
  papel: "administrador" | "secretaria" | "escola",
  idEscola?: number | null
) {
  const session = await getSession();
  if (!session || session.papel !== "administrador") {
    return { success: false, error: "Apenas administradores podem cadastrar usuários." };
  }

  if (!nome || !email || !senhaPlana) {
    return { success: false, error: "Nome, e-mail e senha são obrigatórios." };
  }

  if (papel === "escola" && !idEscola) {
    return { success: false, error: "Usuários do tipo escola devem estar vinculados a uma unidade." };
  }

  try {
    const senhaHash = await bcrypt.hash(senhaPlana, 10);
    const idAuth = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const [novo] = await db
      .insert(perfisUsuarios)
      .values({
        idAuth,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senhaHash,
        papel,
        idEscola: papel === "escola" ? idEscola : null,
      })
      .returning();

    revalidatePath("/admin");
    return { success: true, usuario: novo };
  } catch (err: any) {
    if (err.message.includes("unique") || err.message.includes("duplicate")) {
      return { success: false, error: "Já existe um usuário cadastrado com este e-mail." };
    }
    return { success: false, error: err.message };
  }
}

export async function criarProdutoAction(
  nome: string,
  categoria: "limpeza" | "higiene" | "alimento" | "material" | "outros",
  unidade: string,
  preco: number,
  estoqueMinimo: number,
  descricao?: string
) {
  const session = await getSession();
  if (!session || (session.papel !== "administrador" && session.papel !== "secretaria")) {
    return { success: false, error: "Permissão insuficiente." };
  }

  if (!nome || preco <= 0) {
    return { success: false, error: "Nome e preço válido são obrigatórios." };
  }

  try {
    const [novo] = await db
      .insert(produtos)
      .values({
        nome: nome.trim(),
        categoria,
        unidade: unidade.trim() || "un",
        preco: preco.toFixed(2),
        estoqueMinimo: estoqueMinimo || 10,
        descricao: descricao?.trim() || null,
      })
      .returning();

    revalidatePath("/admin");
    revalidatePath("/escola/pedidos/novo");
    return { success: true, produto: novo };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function criarFornecedorAction(
  nome: string,
  cnpj?: string,
  contato?: string,
  telefone?: string
) {
  const session = await getSession();
  if (!session || session.papel !== "administrador") {
    return { success: false, error: "Apenas administradores podem cadastrar fornecedores." };
  }

  if (!nome || !nome.trim()) {
    return { success: false, error: "O nome do fornecedor é obrigatório." };
  }

  try {
    const [novo] = await db
      .insert(fornecedores)
      .values({
        nome: nome.trim(),
        cnpj: cnpj?.trim() || null,
        contato: contato?.trim() || null,
        telefone: telefone?.trim() || null,
      })
      .returning();

    revalidatePath("/admin");
    revalidatePath("/secretaria");
    return { success: true, fornecedor: novo };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
