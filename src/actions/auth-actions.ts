"use server";

import { db } from "@/db/client";
import { perfisUsuarios, escolas } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession, destroySession } from "@/lib/session";
import { redirect } from "next/navigation";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState | undefined> {
  const email = formData.get("email") as string;
  const senha = formData.get("senha") as string;

  if (!email || !senha) {
    return { error: "Por favor, preencha email e senha." };
  }

  const [usuario] = await db
    .select({
      idAuth: perfisUsuarios.idAuth,
      email: perfisUsuarios.email,
      senhaHash: perfisUsuarios.senhaHash,
      nome: perfisUsuarios.nome,
      papel: perfisUsuarios.papel,
      idEscola: perfisUsuarios.idEscola,
      nomeEscola: escolas.nome,
    })
    .from(perfisUsuarios)
    .leftJoin(escolas, eq(perfisUsuarios.idEscola, escolas.id))
    .where(eq(perfisUsuarios.email, email.trim().toLowerCase()));

  if (!usuario || !usuario.senhaHash) {
    return { error: "Email ou senha incorretos." };
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    return { error: "Email ou senha incorretos." };
  }

  await createSession({
    idAuth: usuario.idAuth,
    email: usuario.email,
    nome: usuario.nome,
    papel: usuario.papel,
    idEscola: usuario.idEscola,
    nomeEscola: usuario.nomeEscola,
  });

  if (usuario.papel === "administrador") {
    redirect("/admin");
  } else if (usuario.papel === "secretaria") {
    redirect("/secretaria");
  } else {
    redirect("/escola");
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
