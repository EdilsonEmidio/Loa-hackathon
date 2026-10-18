import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { perfisUsuarios, escolas } from "@/db/schema";
import { eq } from "drizzle-orm";

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "hackathon-secret-jwt-key-2026-super-secure"
);

const COOKIE_NAME = "gestao_escolar_session";

export interface UserSession {
  idAuth: string;
  email: string;
  nome: string;
  papel: "administrador" | "secretaria" | "escola";
  idEscola: number | null;
  nomeEscola?: string | null;
}

export async function createSession(user: UserSession) {
  const jwt = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const idAuth = payload.idAuth as string;

    // Buscar dados frescos do banco para garantir que mudanças de papel ou escola reflitam na hora
    const [usuario] = await db
      .select({
        idAuth: perfisUsuarios.idAuth,
        email: perfisUsuarios.email,
        nome: perfisUsuarios.nome,
        papel: perfisUsuarios.papel,
        idEscola: perfisUsuarios.idEscola,
        nomeEscola: escolas.nome,
      })
      .from(perfisUsuarios)
      .leftJoin(escolas, eq(perfisUsuarios.idEscola, escolas.id))
      .where(eq(perfisUsuarios.idAuth, idAuth));

    if (!usuario) {
      return null;
    }

    return {
      idAuth: usuario.idAuth,
      email: usuario.email,
      nome: usuario.nome,
      papel: usuario.papel,
      idEscola: usuario.idEscola,
      nomeEscola: usuario.nomeEscola,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
