import { beforeEach, describe, expect, it, vi } from "vitest";
import { liberarAcesso, revogarAcesso, validarSenhaDeAcesso } from "./acesso";

function respostaJson(corpo: unknown) {
  return new Response(JSON.stringify(corpo), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api de acesso do membro", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("liberarAcesso faz PATCH com a senha no corpo", async () => {
    const membro = { id: "m1", acessoLiberado: true };
    fetchMock.mockResolvedValue(respostaJson(membro));

    await expect(liberarAcesso("m1", "senha1234")).resolves.toEqual(membro);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/membros/m1/acesso",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ senha: "senha1234" }) }),
    );
  });

  it("revogarAcesso faz DELETE no mesmo caminho", async () => {
    fetchMock.mockResolvedValue(respostaJson({ id: "m1", acessoLiberado: false }));

    await revogarAcesso("m1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/membros/m1/acesso",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("validarSenhaDeAcesso", () => {
  it("aceita senha com 8 caracteres e confirmação igual", () => {
    expect(validarSenhaDeAcesso("12345678", "12345678")).toEqual({});
  });

  it("recusa senha com menos de 8 caracteres", () => {
    expect(validarSenhaDeAcesso("1234567", "1234567")).toEqual({
      senha: "senha deve ter no mínimo 8 caracteres",
    });
  });

  it("recusa senha com mais de 72 bytes", () => {
    const senha = "á".repeat(37);

    expect(validarSenhaDeAcesso(senha, senha)).toEqual({
      senha: "senha deve ter no máximo 72 bytes",
    });
  });

  it("recusa confirmação diferente", () => {
    expect(validarSenhaDeAcesso("12345678", "12345679")).toEqual({
      confirmacao: "as senhas não conferem",
    });
  });
});
