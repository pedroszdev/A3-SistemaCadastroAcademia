import { sessaoValida } from "./sessao";

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
