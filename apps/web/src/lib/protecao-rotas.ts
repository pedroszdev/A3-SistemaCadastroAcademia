import { type Cargo, type UsuarioDoToken, lerUsuarioDoToken, sessaoValida } from "./sessao";

export const ROTA_LOGIN = "/login";
export const ROTA_INICIAL = "/dashboard";
export const ROTA_ALUNO = "/aluno";

export type Area = UsuarioDoToken["tipo"];

export type DecisaoDeAcesso = {
  redirecionarPara: string | null;
  apagarCookie: boolean;
};

export function areaDaRota(pathname: string): Area {
  return pathname === ROTA_ALUNO || pathname.startsWith(`${ROTA_ALUNO}/`)
    ? "ALUNO"
    : "FUNCIONARIO";
}

export function rotaInicialDe(usuario: UsuarioDoToken): string {
  return usuario.tipo === "ALUNO" ? ROTA_ALUNO : ROTA_INICIAL;
}

// Para onde mandar quem abriu uma área que não é a dele (null se a área é a dele).
export function destinoForaDaArea(area: Area, usuario: UsuarioDoToken): string | null {
  return usuario.tipo === area ? null : rotaInicialDe(usuario);
}

// Checagem otimista para a navegação: quem decide a permissão de verdade é a API.
// Cada tipo de usuário só abre a própria área: aluno em /aluno, funcionário no resto.
export function decidirAcesso(
  pathname: string,
  token: string | undefined,
  agoraEmSegundos: number,
): DecisaoDeAcesso {
  const logado = sessaoValida(token, agoraEmSegundos);
  const apagarCookie = token !== undefined && !logado;
  const usuario = logado ? lerUsuarioDoToken(token) : null;

  if (pathname === ROTA_LOGIN) {
    return { redirecionarPara: usuario ? rotaInicialDe(usuario) : null, apagarCookie };
  }
  if (!usuario) return { redirecionarPara: ROTA_LOGIN, apagarCookie };
  return { redirecionarPara: destinoForaDaArea(areaDaRota(pathname), usuario), apagarCookie };
}

export type SessaoDaArea = { usuario: UsuarioDoToken; cargo: Cargo | null };

// Mesmo critério do proxy (token legível e não expirado), para o layout não abrir
// a área numa rota que o proxy não cobriu. O relógio é lido aqui, e não no
// componente, para o layout continuar puro.
export function sessaoDaArea(
  token: string | undefined,
  agoraEmSegundos = Math.floor(Date.now() / 1000),
): SessaoDaArea | null {
  const usuario = lerUsuarioDoToken(token);
  if (!usuario || !sessaoValida(token, agoraEmSegundos)) return null;
  return { usuario, cargo: usuario.tipo === "FUNCIONARIO" ? usuario.cargo : null };
}
