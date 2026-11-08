import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { config, proxy } from "./proxy";

const AGORA = new Date("2026-11-06T12:00:00.000Z");

function jwt(payload: unknown) {
  return `cabecalho.${btoa(JSON.stringify(payload)).replaceAll("=", "")}.assinatura`;
}

function requisicao(caminho: string, token?: string) {
  return new NextRequest(`http://localhost:3001${caminho}`, {
    headers: token ? { cookie: `token=${token}` } : {},
  });
}

describe("proxy", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: AGORA });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("redireciona para o login sem sessão", () => {
    const res = proxy(requisicao("/membros"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("deixa seguir com sessão válida", () => {
    const token = jwt({
      tipo: "FUNCIONARIO",
      cargo: "ADMIN",
      exp: AGORA.getTime() / 1000 + 60,
    });

    const res = proxy(requisicao("/membros", token));

    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("manda o aluno para o portal", () => {
    const token = jwt({ tipo: "ALUNO", exp: AGORA.getTime() / 1000 + 60 });

    const res = proxy(requisicao("/dashboard", token));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3001/aluno");
  });

  it("apaga o cookie do token expirado", () => {
    const token = jwt({
      tipo: "FUNCIONARIO",
      cargo: "ADMIN",
      exp: AGORA.getTime() / 1000 - 1,
    });

    const res = proxy(requisicao("/membros", token));

    expect(res.headers.get("location")).toBe("http://localhost:3001/login");
    expect(res.cookies.get("token")?.value).toBe("");
  });
});

describe("config.matcher", () => {
  // O unstable_doesMiddlewareMatch do Next não roda no vitest, então o padrão vira regex.
  const passaPeloProxy = (caminho: string) =>
    new RegExp(`^${config.matcher[0]}$`).test(caminho);

  it.each(["/", "/login", "/dashboard", "/membros/123", "/membros/joao.silva"])(
    "passa %s pelo proxy",
    (caminho) => {
      expect(passaPeloProxy(caminho)).toBe(true);
    },
  );

  it.each([
    "/api/sessao",
    "/api/membros/1",
    "/_next/static/chunks/app.js",
    "/_next/image",
    "/favicon.ico",
    "/logo.svg",
    "/foto.png",
  ])("deixa %s fora do proxy", (caminho) => {
    expect(passaPeloProxy(caminho)).toBe(false);
  });
});
