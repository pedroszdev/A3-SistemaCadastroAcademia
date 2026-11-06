import { type Cargo, type UsuarioDoToken, lerUsuarioDoToken, sessaoValida } from "./sessao";

export const ROTA_LOGIN = "/login";
export const ROTA_INICIAL = "/dashboard";

export type DecisaoDeAcesso = {
  redirecionarPara: string | null;
  apagarCookie: boolean;
};

// Checagem otimista para a navegação: quem decide a permissão de verdade é a API.
export function decidirAcesso(
  pathname: string,
  token: string | undefined,
  agoraEmSegundos: number,
): DecisaoDeAcesso {
  const logado = sessaoValida(token, agoraEmSegundos);
  const apagarCookie = token !== undefined && !logado;

  if (pathname === ROTA_LOGIN) {
    return { redirecionarPara: logado ? ROTA_INICIAL : null, apagarCookie };
  }
  return { redirecionarPara: logado ? null : ROTA_LOGIN, apagarCookie };
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
