import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "./api";

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const replace = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    replace.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("location", { replace });
  });

  it("devolve o JSON da resposta quando a requisição dá certo", async () => {
    fetchMock.mockResolvedValue(respostaJson({ status: "ok" }));

    await expect(api("/health")).resolves.toEqual({ status: "ok" });
  });

  it("chama o repasse em /api, não a API direto", async () => {
    fetchMock.mockResolvedValue(respostaJson({}));

    await api("/membros?page=2");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/membros?page=2",
      expect.any(Object),
    );
  });

  it("envia JSON e mescla as opções e os headers extras", async () => {
    fetchMock.mockResolvedValue(respostaJson({ id: "1" }, 201));
    const body = JSON.stringify({ nome: "Fulano" });

    await api("/membros", {
      method: "POST",
      body,
      headers: { "X-Extra": "1" },
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/membros", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json", "X-Extra": "1" },
    });
  });

  it("devolve undefined num 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(api("/membros/1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("lança ApiError com a mensagem do JSON de erro do Nest", async () => {
    fetchMock.mockResolvedValue(
      respostaJson(
        { statusCode: 409, message: "CPF já cadastrado", error: "Conflict" },
        409,
      ),
    );

    const erro = await api("/membros").catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).toMatchObject({ status: 409, message: "CPF já cadastrado" });
    expect(replace).not.toHaveBeenCalled();
  });

  it("junta a lista de mensagens de validação", async () => {
    fetchMock.mockResolvedValue(
      respostaJson(
        {
          statusCode: 400,
          message: ["nome é obrigatório", "cpf inválido"],
          error: "Bad Request",
        },
        400,
      ),
    );

    await expect(api("/membros")).rejects.toMatchObject({
      status: 400,
      message: "nome é obrigatório; cpf inválido",
    });
  });

  it("usa o texto cru quando o erro não é JSON", async () => {
    fetchMock.mockResolvedValue(new Response("Falhou", { status: 500 }));

    await expect(api("/membros")).rejects.toMatchObject({
      status: 500,
      message: "Falhou",
    });
  });

  it("usa o texto cru quando o JSON não tem message", async () => {
    fetchMock.mockResolvedValue(respostaJson({ erro: "x" }, 500));

    await expect(api("/membros")).rejects.toMatchObject({
      message: '{"erro":"x"}',
    });
  });

  it("vai para o login e lança ApiError 401 quando a sessão expirou", async () => {
    fetchMock.mockResolvedValue(
      respostaJson({ statusCode: 401, message: "Unauthorized" }, 401),
    );

    await expect(api("/membros")).rejects.toMatchObject({ status: 401 });
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
