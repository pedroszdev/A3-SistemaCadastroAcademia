import { redirect } from "next/navigation";
import { ROTA_INICIAL } from "@/lib/protecao-rotas";

// Sem sessão, o proxy já mandou para o login antes de chegar aqui.
export default function Home() {
  redirect(ROTA_INICIAL);
}
