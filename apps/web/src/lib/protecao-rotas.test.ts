import { describe, expect, it } from "vitest";
import { decidirAcesso, sessaoDaArea } from "./protecao-rotas";

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

describe("sessaoDaArea", () => {
  it("devolve o usuário e o cargo do funcionário com sessão válida", () => {
    expect(sessaoDaArea(valido, AGORA)).toEqual({
      usuario: { tipo: "FUNCIONARIO", cargo: "ADMIN" },
      cargo: "ADMIN",
    });
  });

  it("devolve o aluno com sessão válida e sem cargo", () => {
    const aluno = jwt({ tipo: "ALUNO", exp: AGORA + 60 });

    expect(sessaoDaArea(aluno, AGORA)).toEqual({
      usuario: { tipo: "ALUNO" },
      cargo: null,
    });
  });

  it.each([
    ["sem token", undefined],
    ["token malformado", "abc"],
    ["token expirado", expirado],
  ])("não abre a área com %s", (_, token) => {
    expect(sessaoDaArea(token, AGORA)).toBeNull();
  });

  it("usa a hora atual quando não recebe o agora", () => {
    const agora = Math.floor(Date.now() / 1000);
    const vigente = jwt({ tipo: "FUNCIONARIO", cargo: "ADMIN", exp: agora + 60 });
    const vencido = jwt({ tipo: "FUNCIONARIO", cargo: "ADMIN", exp: agora - 60 });

    expect(sessaoDaArea(vigente)?.cargo).toBe("ADMIN");
    expect(sessaoDaArea(vencido)).toBeNull();
  });
});
