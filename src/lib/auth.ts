import { getSession, UserSession } from "./session";
import { redirect } from "next/navigation";

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(
  allowedRoles: Array<"administrador" | "secretaria" | "escola">
): Promise<UserSession> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.papel)) {
    // Redireciona para sua área de direito
    if (session.papel === "escola") redirect("/escola");
    if (session.papel === "secretaria") redirect("/secretaria");
    if (session.papel === "administrador") redirect("/admin");
    redirect("/login");
  }
  return session;
}

export async function requireEscolaScope(): Promise<{
  session: UserSession;
  idEscola: number;
}> {
  const session = await requireAuth();

  if (session.papel === "escola") {
    if (!session.idEscola) {
      throw new Error("Usuário de escola sem vínculo institucional cadastrado.");
    }
    return { session, idEscola: session.idEscola };
  }

  if (session.papel === "administrador") {
    // Administrador acessando escopo da escola (se tiver escola selecionada ou padrão)
    return { session, idEscola: session.idEscola || 1 };
  }

  throw new Error("Acesso não autorizado para o ambiente da escola.");
}
