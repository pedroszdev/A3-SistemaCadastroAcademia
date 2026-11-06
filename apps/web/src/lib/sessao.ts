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
function lerPayload(token: string | null | undefined): Record<string, unknown> | null {
  const payload = token?.split(".")[1];
  if (!payload) return null;

  try {
    const base64 = payload.replaceAll("-", "+").replaceAll("_", "/");
    const completo = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const dados: unknown = JSON.parse(atob(completo));
    if (typeof dados !== "object" || dados === null) return null;
    return dados as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function lerUsuarioDoToken(
  token: string | null | undefined,
): UsuarioDoToken | null {
  const dados = lerPayload(token);
  if (!dados) return null;

  const { tipo, cargo } = dados;
  if (tipo === "ALUNO") return { tipo: "ALUNO" };
  if (tipo === "FUNCIONARIO" && typeof cargo === "string" && CARGOS.includes(cargo)) {
    return { tipo: "FUNCIONARIO", cargo: cargo as Cargo };
  }
  return null;
}

// Segundos que faltam para o token expirar (claim exp); null se não houver exp.
export function segundosAteExpirar(
  token: string | null | undefined,
  agoraEmSegundos: number,
): number | null {
  const exp = lerPayload(token)?.exp;
  return typeof exp === "number" ? exp - agoraEmSegundos : null;
}

export function sessaoValida(
  token: string | null | undefined,
  agoraEmSegundos: number,
): boolean {
  if (!lerUsuarioDoToken(token)) return false;
  const restante = segundosAteExpirar(token, agoraEmSegundos);
  return restante === null || restante > 0;
}

export const COOKIE_TOKEN_APAGADO = `${COOKIE_TOKEN}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;

// O cookie expira junto com o token; em produção só trafega por HTTPS.
export function cookieDoToken(token: string, maxAgeEmSegundos: number | null): string {
  const partes = [
    `${COOKIE_TOKEN}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (maxAgeEmSegundos !== null) partes.push(`Max-Age=${Math.max(0, maxAgeEmSegundos)}`);
  if (process.env.NODE_ENV === "production") partes.push("Secure");
  return partes.join("; ");
}
