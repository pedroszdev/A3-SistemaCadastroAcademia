import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type Pagina, useFormEmDialog, useListaPaginada } from "./use-lista-paginada";

type Filtro = { termo?: string; page: number };

function pagina(data: string[], extra: Partial<Pagina<string>> = {}): Pagina<string> {
  return { data, total: data.length, page: 1, pageSize: 20, ...extra };
}

function adiada() {
  let resolver: (valor: Pagina<string>) => void = () => {};
  const promessa = new Promise<Pagina<string>>((resolve) => {
    resolver = resolve;
  });
  return { promessa, resolver };
}

describe("useListaPaginada", () => {
  it("carrega com o filtro inicial", async () => {
    const carregar = vi.fn<(filtro: Filtro) => Promise<Pagina<string>>>();
    carregar.mockResolvedValue(pagina(["a"]));

    const { result } = renderHook(() => useListaPaginada(carregar, { page: 1 }));

    expect(result.current.pagina).toBeNull();
    await waitFor(() => expect(result.current.pagina).toEqual(pagina(["a"])));
    expect(carregar).toHaveBeenCalledWith({ page: 1 });
    expect(result.current.erro).toBeNull();
  });

  it("recarrega quando o filtro muda", async () => {
    const carregar = vi.fn<(filtro: Filtro) => Promise<Pagina<string>>>();
    carregar.mockResolvedValue(pagina(["a"]));
    const { result } = renderHook(() => useListaPaginada(carregar, { page: 1 }));
    await waitFor(() => expect(result.current.pagina).not.toBeNull());

    act(() => result.current.setFiltro({ termo: "b", page: 1 }));

    await waitFor(() => expect(carregar).toHaveBeenLastCalledWith({ termo: "b", page: 1 }));
    expect(result.current.filtro).toEqual({ termo: "b", page: 1 });
  });

  it("recarregar chama de novo com o mesmo filtro", async () => {
    const carregar = vi.fn<(filtro: Filtro) => Promise<Pagina<string>>>();
    carregar.mockResolvedValue(pagina(["a"]));
    const { result } = renderHook(() => useListaPaginada(carregar, { page: 1 }));
    await waitFor(() => expect(result.current.pagina).not.toBeNull());

    act(() => result.current.recarregar());

    await waitFor(() => expect(carregar).toHaveBeenCalledTimes(2));
    expect(carregar).toHaveBeenLastCalledWith({ page: 1 });
  });

  it("volta para a última página quando a atual fica vazia", async () => {
    const carregar = vi.fn<(filtro: Filtro) => Promise<Pagina<string>>>();
    carregar.mockImplementation(async ({ page }) =>
      page === 3 ? pagina([], { page: 3, total: 40 }) : pagina(["a"], { page, total: 40 }),
    );
    const { result } = renderHook(() => useListaPaginada(carregar, { page: 3 }));

    await waitFor(() => expect(result.current.pagina?.data).toEqual(["a"]));

    expect(carregar).toHaveBeenLastCalledWith({ page: 2 });
    expect(result.current.filtro.page).toBe(2);
  });

  it("mantém a página vazia quando é a primeira", async () => {
    const carregar = vi.fn<(filtro: Filtro) => Promise<Pagina<string>>>();
    carregar.mockResolvedValue(pagina([], { total: 0 }));

    const { result } = renderHook(() => useListaPaginada(carregar, { page: 1 }));

    await waitFor(() => expect(result.current.pagina).toEqual(pagina([], { total: 0 })));
    expect(carregar).toHaveBeenCalledTimes(1);
  });

  it("guarda a mensagem do erro e tira a página antiga", async () => {
    const carregar = vi.fn<(filtro: Filtro) => Promise<Pagina<string>>>();
    carregar.mockResolvedValueOnce(pagina(["a"]));
    const { result } = renderHook(() => useListaPaginada(carregar, { page: 1 }));
    await waitFor(() => expect(result.current.pagina).not.toBeNull());
    carregar.mockRejectedValue(new Error("Falha ao listar"));

    act(() => result.current.recarregar());

    await waitFor(() => expect(result.current.erro).toBe("Falha ao listar"));
    expect(result.current.pagina).toBeNull();
  });

  it("uma resposta antiga não sobrescreve a mais nova", async () => {
    const antiga = adiada();
    const nova = adiada();
    const carregar = vi.fn<(filtro: Filtro) => Promise<Pagina<string>>>();
    carregar.mockReturnValueOnce(antiga.promessa).mockReturnValueOnce(nova.promessa);
    const { result } = renderHook(() => useListaPaginada(carregar, { page: 1 }));
    act(() => result.current.setFiltro({ termo: "novo", page: 1 }));
    await waitFor(() => expect(carregar).toHaveBeenCalledTimes(2));

    await act(async () => nova.resolver(pagina(["nova"])));
    await act(async () => antiga.resolver(pagina(["antiga"])));

    expect(result.current.pagina?.data).toEqual(["nova"]);
  });

  it("um erro antigo não sobrescreve a resposta mais nova", async () => {
    let falhar: (e: Error) => void = () => {};
    const antiga = new Promise<Pagina<string>>((_, rejeitar) => {
      falhar = rejeitar;
    });
    const carregar = vi.fn<(filtro: Filtro) => Promise<Pagina<string>>>();
    carregar.mockReturnValueOnce(antiga).mockResolvedValueOnce(pagina(["nova"]));
    const { result } = renderHook(() => useListaPaginada(carregar, { page: 1 }));
    act(() => result.current.setFiltro({ termo: "novo", page: 1 }));
    await waitFor(() => expect(result.current.pagina?.data).toEqual(["nova"]));

    await act(async () => falhar(new Error("Falha antiga")));

    expect(result.current.erro).toBeNull();
    expect(result.current.pagina?.data).toEqual(["nova"]);
  });
});

describe("useFormEmDialog", () => {
  it("começa fechado", () => {
    const { result } = renderHook(() => useFormEmDialog());

    expect(result.current.form).toEqual({ aberto: false, chave: 0 });
  });

  it("abrir incrementa a chave a cada abertura", () => {
    const { result } = renderHook(() => useFormEmDialog());

    act(() => result.current.abrir());
    expect(result.current.form).toEqual({ aberto: true, chave: 1 });

    act(() => result.current.fechar());
    expect(result.current.form).toEqual({ aberto: false, chave: 1 });

    act(() => result.current.abrir());
    expect(result.current.form).toEqual({ aberto: true, chave: 2 });
  });

  it("fecharSeAinda fecha quando a chave é a atual", () => {
    const { result } = renderHook(() => useFormEmDialog());
    act(() => result.current.abrir());

    act(() => result.current.fecharSeAinda(1));

    expect(result.current.form).toEqual({ aberto: false, chave: 1 });
  });

  it("fecharSeAinda com chave velha não fecha o formulário reaberto", () => {
    const { result } = renderHook(() => useFormEmDialog());
    act(() => result.current.abrir());
    act(() => result.current.fechar());
    act(() => result.current.abrir());

    act(() => result.current.fecharSeAinda(1));

    expect(result.current.form).toEqual({ aberto: true, chave: 2 });
  });
});
