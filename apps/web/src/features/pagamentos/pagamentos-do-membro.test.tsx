import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { UsuarioProvider } from "@/features/auth/usuario";
import type { UsuarioDoToken } from "@/lib/sessao";
import {
  buscarMembros,
  cancelarPagamento,
  criarPagamento,
  listarPagamentos,
  type Pagamento,
  type PaginaPagamentos,
  registrarPagamento,
} from "./api";
import { PagamentosDoMembro } from "./pagamentos-do-membro";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  listarPagamentos: vi.fn(),
  registrarPagamento: vi.fn(),
  cancelarPagamento: vi.fn(),
  criarPagamento: vi.fn(),
  buscarMembros: vi.fn(),
}));

function pagamento(
  id: string,
  status: Pagamento["status"],
  extra: Partial<Pagamento> = {},
): Pagamento {
  return {
    id,
    membroId: "m1",
    valor: 150,
    dataVencimento: "2026-11-01T00:00:00.000Z",
    dataPagamento: null,
    status,
    diasEmAtraso: 0,
    membro: { id: "m1", nome: "Fulano Silva" },
    ...extra,
  };
}

const pendente = pagamento("p1", "PENDENTE");
const atrasado = pagamento("p2", "ATRASADO", {
  valor: 89.9,
  dataVencimento: "2026-10-20T00:00:00.000Z",
  diasEmAtraso: 12,
});
const pago = pagamento("p3", "PAGO", { dataPagamento: "2026-11-03T00:00:00.000Z" });

function pagina(data: Pagamento[]): PaginaPagamentos {
  return { data, total: data.length, page: 1, pageSize: 20 };
}

const recepcionista: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" };

function Raiz({ membroId, usuario }: { membroId: string; usuario: UsuarioDoToken }) {
  return (
    <UsuarioProvider usuario={usuario}>
      <ToastProvider>
        <PagamentosDoMembro membroId={membroId} />
      </ToastProvider>
    </UsuarioProvider>
  );
}

function renderizar(usuario: UsuarioDoToken = recepcionista, membroId = "m1") {
  return render(<Raiz membroId={membroId} usuario={usuario} />);
}

function linhaDe(texto: string): HTMLElement {
  return screen.getByText(texto).closest("tr") as HTMLElement;
}

describe("PagamentosDoMembro", () => {
  beforeEach(() => {
    vi.mocked(listarPagamentos).mockReset();
    vi.mocked(registrarPagamento).mockReset();
    vi.mocked(cancelarPagamento).mockReset();
    vi.mocked(criarPagamento).mockReset();
    vi.mocked(buscarMembros).mockReset();
    vi.mocked(listarPagamentos).mockResolvedValue(pagina([pendente, atrasado, pago]));
  });

  it("lista os pagamentos do membro, sem a coluna Membro", async () => {
    renderizar();

    expect(await screen.findByText("Atrasado · 12 dias")).toBeInTheDocument();
    expect(listarPagamentos).toHaveBeenCalledWith({ page: 1, membroId: "m1" });
    expect(screen.queryByRole("columnheader", { name: "Membro" })).toBeNull();
    for (const titulo of ["Valor", "Vencimento", "Pagamento", "Status", "Ações"]) {
      expect(screen.getByRole("columnheader", { name: titulo })).toBeInTheDocument();
    }
  });

  it("mantém o membroId ao filtrar por status e por vencimento", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Atrasado · 12 dias");

    await usuario.selectOptions(screen.getByLabelText("Status"), "ATRASADO");
    expect(listarPagamentos).toHaveBeenLastCalledWith({
      page: 1,
      membroId: "m1",
      status: "ATRASADO",
    });

    fireEvent.change(screen.getByLabelText("Vencimento de"), { target: { value: "2026-11-01" } });
    expect(listarPagamentos).toHaveBeenLastCalledWith({
      page: 1,
      membroId: "m1",
      status: "ATRASADO",
      vencimentoDe: "2026-11-01",
    });
  });

  it("registra o pagamento de uma linha atrasada e recarrega com o mesmo membroId", async () => {
    const atrasadoPago = { ...atrasado, status: "PAGO" as const };
    vi.mocked(registrarPagamento).mockResolvedValue(atrasadoPago);
    vi.mocked(listarPagamentos)
      .mockResolvedValueOnce(pagina([pendente, atrasado]))
      .mockResolvedValueOnce(pagina([pendente, atrasadoPago]));
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Atrasado · 12 dias");

    await usuario.click(
      within(linhaDe("Atrasado · 12 dias")).getByRole("button", { name: /Registrar pagamento/ }),
    );
    await usuario.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar" }),
    );

    expect(registrarPagamento).toHaveBeenCalledWith("p2", undefined);
    expect(await screen.findByText("Pagamento registrado.")).toBeInTheDocument();
    expect(listarPagamentos).toHaveBeenCalledTimes(2);
    expect(listarPagamentos).toHaveBeenLastCalledWith({ page: 1, membroId: "m1" });
    await waitFor(() => expect(screen.queryByText("Atrasado · 12 dias")).toBeNull());
    expect(screen.getAllByRole("button", { name: /Registrar pagamento/ })).toHaveLength(1);
  });

  it("cancela uma linha em aberto depois de confirmar", async () => {
    vi.mocked(cancelarPagamento).mockResolvedValue({ ...pendente, status: "CANCELADO" });
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Atrasado · 12 dias");

    await usuario.click(screen.getAllByRole("button", { name: /Cancelar pagamento/ })[0]);
    await usuario.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar" }),
    );

    expect(cancelarPagamento).toHaveBeenCalledWith("p1");
    expect(await screen.findByText("Pagamento cancelado.")).toBeInTheDocument();
    expect(listarPagamentos).toHaveBeenLastCalledWith({ page: 1, membroId: "m1" });
  });

  it("abre Novo pagamento sem a busca de membro e lança com o membro fixo", async () => {
    vi.mocked(criarPagamento).mockResolvedValue({ ...pendente, id: "p9" });
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Atrasado · 12 dias");

    await usuario.click(screen.getByRole("button", { name: "Novo pagamento" }));
    const dialogo = screen.getByRole("dialog", { name: "Novo pagamento" });
    expect(within(dialogo).queryByLabelText("Membro")).toBeNull();
    await usuario.type(within(dialogo).getByLabelText("Valor"), "8990");
    fireEvent.change(within(dialogo).getByLabelText("Vencimento"), {
      target: { value: "2026-11-20" },
    });
    await usuario.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(criarPagamento).toHaveBeenCalledWith({
      membroId: "m1",
      valor: 89.9,
      dataVencimento: "2026-11-20",
    });
    expect(buscarMembros).not.toHaveBeenCalled();
    expect(await screen.findByText("Pagamento lançado.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listarPagamentos).toHaveBeenCalledTimes(2);
    expect(listarPagamentos).toHaveBeenLastCalledWith({ page: 1, membroId: "m1" });
  });

  it.each([
    ["INSTRUTOR", { tipo: "FUNCIONARIO", cargo: "INSTRUTOR" } as UsuarioDoToken],
    ["ALUNO", { tipo: "ALUNO" } as UsuarioDoToken],
  ])("mostra Acesso restrito e não chama a API para %s", (_perfil, usuarioLogado) => {
    renderizar(usuarioLogado);

    expect(screen.getByText("Acesso restrito")).toBeInTheDocument();
    expect(listarPagamentos).not.toHaveBeenCalled();
  });

  it("recarrega a lista do novo membro quando o membroId muda", async () => {
    const { rerender } = renderizar();
    await screen.findByText("Atrasado · 12 dias");

    rerender(<Raiz membroId="m2" usuario={recepcionista} />);

    await waitFor(() =>
      expect(listarPagamentos).toHaveBeenLastCalledWith({ page: 1, membroId: "m2" }),
    );
  });
});
