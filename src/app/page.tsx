import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.papel === "administrador") {
    redirect("/admin");
  } else if (session.papel === "secretaria") {
    redirect("/secretaria");
  } else {
    redirect("/escola");
  }
}
