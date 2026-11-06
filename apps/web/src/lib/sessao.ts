export type Cargo = "ADMIN" | "RECEPCIONISTA" | "INSTRUTOR";

export type UsuarioDoToken =
  | { tipo: "FUNCIONARIO"; cargo: Cargo }
  | { tipo: "ALUNO" };

export const COOKIE_TOKEN = "token";

const CARGOS: readonly string[] = ["ADMIN", "RECEPCIONISTA", "INSTRUTOR"];

export function lerCookie(
  cabecalho: string | null,
  nome: string,
): string | undefined {
  if (!cabecalho) return undefined;

  for (const parte of cabecalho.split(";")) {
    const item = parte.trim();
    if (item.startsWith(`${nome}=`)) {
      try {
        return decodeURIComponent(item.slice(nome.length + 1));
      } catch {
        // Valor malformado conta como cookie ausente: a API responde 401 e o repasse apaga o cookie.
        return undefined;
      }
    }
  }
  return undefined;
}

// Decodifica sem verificar a assinatura, só para montar a interface; a permissão real é da API.
export function lerUsuarioDoToken(
  token: string | null | undefined,
): UsuarioDoToken | null {
  const payload = token?.split(".")[1];
  if (!payload) return null;

  try {
    const base64 = payload.replaceAll("-", "+").replaceAll("_", "/");
    const completo = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const dados: unknown = JSON.parse(atob(completo));
    if (typeof dados !== "object" || dados === null) return null;

    const { tipo, cargo } = dados as { tipo?: unknown; cargo?: unknown };
    if (tipo === "ALUNO") return { tipo: "ALUNO" };
    if (tipo === "FUNCIONARIO" && typeof cargo === "string" && CARGOS.includes(cargo)) {
      return { tipo: "FUNCIONARIO", cargo: cargo as Cargo };
    }
    return null;
  } catch {
    return null;
  }
}
