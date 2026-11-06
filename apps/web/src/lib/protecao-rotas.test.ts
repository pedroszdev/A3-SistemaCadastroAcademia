import { describe, expect, it } from "vitest";
import { decidirAcesso } from "./protecao-rotas";

function jwt(payload: unknown) {
  return `cabecalho.${btoa(JSON.stringify(payload)).replaceAll("=", "")}.assinatura`;
}

const AGORA = 1_000;
const valido = jwt({ tipo: "FUNCIONARIO", cargo: "ADMIN", exp: AGORA + 60 });
const expirado = jwt({ tipo: "FUNCIONARIO", cargo: "ADMIN", exp: AGORA });

describe("decidirAcesso", () => {
  it.each(["/", "/dashboard", "/membros/123"])(
    "deixa o usuário logado seguir em %s",
    (rota) => {
      expect(decidirAcesso(rota, valido, AGORA)).toEqual({
        redirecionarPara: null,
        apagarCookie: false,
      });
    },
  );

  it("manda para o login quem não tem cookie", () => {
    expect(decidirAcesso("/membros", undefined, AGORA)).toEqual({
      redirecionarPara: "/login",
      apagarCookie: false,
    });
  });

  it.each([
    ["expirado", expirado],
    ["malformado", "lixo"],
  ])("manda para o login e apaga o cookie com token %s", (_, token) => {
    expect(decidirAcesso("/membros", token, AGORA)).toEqual({
      redirecionarPara: "/login",
      apagarCookie: true,
    });
  });

  it("abre o login para quem não está logado", () => {
    expect(decidirAcesso("/login", undefined, AGORA)).toEqual({
      redirecionarPara: null,
      apagarCookie: false,
    });
  });

  it("abre o login e apaga o cookie expirado", () => {
    expect(decidirAcesso("/login", expirado, AGORA)).toEqual({
      redirecionarPara: null,
      apagarCookie: true,
    });
  });

  it("manda para o dashboard quem já está logado e abre o login", () => {
    expect(decidirAcesso("/login", valido, AGORA)).toEqual({
      redirecionarPara: "/dashboard",
      apagarCookie: false,
    });
  });
});
