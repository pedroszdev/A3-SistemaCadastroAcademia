import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { UsuarioProvider } from "@/features/auth/usuario";
import { ApiError } from "@/lib/api";
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
import { TelaPagamentos } from "./tela-pagamentos";

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
  nome: string,
  extra: Partial<Pagamento> = {},
): Pagamento {
  return {
    id,
    membroId: `m-${id}`,
    valor: 150,
    dataVencimento: "2026-11-01T00:00:00.000Z",
    dataPagamento: null,
    status,
    diasEmAtraso: 0,
    membro: { id: `m-${id}`, nome },
    ...extra,
  };
}

const fulano = pagamento("p1", "PENDENTE", "Fulano Silva");
const beltrana = pagamento("p2", "ATRASADO", "Beltrana Souza", {
  valor: 89.9,
  dataVencimento: "2026-10-20T00:00:00.000Z",
  diasEmAtraso: 12,
});
const ciclano = pagamento("p3", "PAGO", "Ciclano Lima", {
  dataPagamento: "2026-11-03T00:00:00.000Z",
});
const deltrano = pagamento("p4", "CANCELADO", "Deltrano Reis");

function pagina(data: Pagamento[], extra: Partial<PaginaPagamentos> = {}): PaginaPagamentos {
  return { data, total: data.length, page: 1, pageSize: 20, ...extra };
}

const recepcionista: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" };

function renderizar(usuario: UsuarioDoToken = recepcionista) {
  render(
    <UsuarioProvider usuario={usuario}>
      <ToastProvider>
        <TelaPagamentos />
      </ToastProvider>
    </UsuarioProvider>,
  );
}

function linhaDe(nome: string): HTMLElement {
  return screen.getByText(nome).closest("tr") as HTMLElement;
}

describe("TelaPagamentos", () => {
  beforeEach(() => {
    vi.mocked(listarPagamentos).mockReset();
    vi.mocked(registrarPagamento).mockReset();
    vi.mocked(cancelarPagamento).mockReset();
    vi.mocked(criarPagamento).mockReset();
    vi.mocked(buscarMembros).mockReset();
    vi.mocked(listarPagamentos).mockResolvedValue(pagina([fulano, beltrana, ciclano, deltrano]));
  });

  it("mostra a tabela com valor, datas e status de cada pagamento", async () => {
    renderizar();

    expect(await screen.findByText("Fulano Silva")).toBeInTheDocument();
    for (const titulo of ["Membro", "Valor", "Vencimento", "Pagamento", "Status", "Ações"]) {
      expect(screen.getByRole("columnheader", { name: titulo })).toBeInTheDocument();
    }
    expect(listarPagamentos).toHaveBeenCalledWith({ page: 1 });

    const pendente = within(linhaDe("Fulano Silva"));
    expect(pendente.getByText(/R\$\s150,00/)).toBeInTheDocument();
    expect(pendente.getByText("01/11/2026")).toBeInTheDocument();
    expect(pendente.getByText("—")).toBeInTheDocument();
    expect(pendente.getByText("Pendente")).toBeInTheDocument();

    const atrasado = within(linhaDe("Beltrana Souza"));
    expect(atrasado.getByText(/R\$\s89,90/)).toBeInTheDocument();
    expect(atrasado.getByText("Atrasado · 12 dias")).toBeInTheDocument();

    const pago = within(linhaDe("Ciclano Lima"));
    expect(pago.getByText("03/11/2026")).toBeInTheDocument();
    expect(pago.getByText("Pago")).toBeInTheDocument();

    expect(within(linhaDe("Deltrano Reis")).getByText("Cancelado")).toBeInTheDocument();
  });

  it("oferece as ações só nas linhas pendentes e atrasadas", async () => {
    renderizar();
    await screen.findByText("Fulano Silva");

    expect(screen.getByRole("button", { name: "Registrar pagamento de Fulano Silva" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar pagamento de Fulano Silva" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar pagamento de Beltrana Souza" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar pagamento de Beltrana Souza" })).toBeInTheDocument();
    expect(within(linhaDe("Ciclano Lima")).queryByRole("button")).toBeNull();
    expect(within(linhaDe("Deltrano Reis")).queryByRole("button")).toBeNull();
  });

  it("filtra por status voltando para a página 1 e limpa o filtro", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.selectOptions(screen.getByLabelText("Status"), "ATRASADO");
    expect(listarPagamentos).toHaveBeenLastCalledWith({ status: "ATRASADO", page: 1 });

    await usuario.selectOptions(screen.getByLabelText("Status"), "");
    expect(listarPagamentos).toHaveBeenLastCalledWith({ status: undefined, page: 1 });
  });

  it("filtra pelo período de vencimento e limpa as datas", async () => {
    renderizar();
    await screen.findByText("Fulano Silva");

    fireEvent.change(screen.getByLabelText("Vencimento de"), { target: { value: "2026-11-01" } });
    expect(listarPagamentos).toHaveBeenLastCalledWith({ vencimentoDe: "2026-11-01", page: 1 });
    expect(screen.getByLabelText("Vencimento até")).toHaveAttribute("min", "2026-11-01");

    fireEvent.change(screen.getByLabelText("Vencimento até"), { target: { value: "2026-11-30" } });
    expect(listarPagamentos).toHaveBeenLastCalledWith({
      vencimentoDe: "2026-11-01",
      vencimentoAte: "2026-11-30",
      page: 1,
    });
    expect(screen.getByLabelText("Vencimento de")).toHaveAttribute("max", "2026-11-30");

    fireEvent.change(screen.getByLabelText("Vencimento de"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Vencimento até"), { target: { value: "" } });
    expect(listarPagamentos).toHaveBeenLastCalledWith({
      vencimentoDe: undefined,
      vencimentoAte: undefined,
      page: 1,
    });
  });

  it("pede a página 2 em Próxima", async () => {
    vi.mocked(listarPagamentos).mockResolvedValue(pagina([fulano], { total: 40 }));
    renderizar();
    await screen.findByText("Fulano Silva");

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(listarPagamentos).toHaveBeenLastCalledWith({ page: 2 });
  });

  it("mostra a lista vazia", async () => {
    vi.mocked(listarPagamentos).mockResolvedValue(pagina([]));
    renderizar();

    expect(await screen.findByText("Nenhum pagamento encontrado")).toBeInTheDocument();
  });

  it("mostra a mensagem da API quando a lista falha", async () => {
    vi.mocked(listarPagamentos).mockRejectedValue(
      new ApiError(400, "vencimentoAte não pode ser anterior a vencimentoDe"),
    );
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "vencimentoAte não pode ser anterior a vencimentoDe",
    );
  });

  it("tira a tabela antiga quando a lista falha depois de um filtro", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");
    vi.mocked(listarPagamentos).mockRejectedValue(new ApiError(500, "Falha ao listar"));

    await usuario.selectOptions(screen.getByLabelText("Status"), "PAGO");

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao listar");
    expect(screen.queryByText("Fulano Silva")).toBeNull();
  });

  it("volta para a última página com registros quando a atual fica vazia", async () => {
    // A página 2 esvaziou (ex.: deu baixa no último pendente dela) e sobraram 20 registros.
    vi.mocked(listarPagamentos).mockImplementation(async ({ page }) =>
      page === 2 ? pagina([], { page: 2, total: 20 }) : pagina([fulano], { total: 40 }),
    );
    renderizar();
    await screen.findByText("Fulano Silva");

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("Fulano Silva")).toBeInTheDocument();
    expect(listarPagamentos).toHaveBeenLastCalledWith({ page: 1 });
    expect(screen.queryByText("Nenhum pagamento encontrado")).toBeNull();
  });

  it("registra o pagamento sem data, avisa e recarrega a lista", async () => {
    vi.mocked(registrarPagamento).mockResolvedValue({ ...fulano, status: "PAGO" });
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Registrar pagamento de Fulano Silva" }));
    const dialogo = screen.getByRole("dialog", { name: "Registrar pagamento" });
    expect(
      within(dialogo).getByText(
        /Confirmar o pagamento de R\$\s150,00 de Fulano Silva, com vencimento em 01\/11\/2026\?/,
      ),
    ).toBeInTheDocument();
    expect(within(dialogo).getByLabelText("Data do pagamento")).toHaveValue("");
    expect(within(dialogo).getByText("Em branco, vale a data de hoje.")).toBeInTheDocument();
    await usuario.click(within(dialogo).getByRole("button", { name: "Confirmar" }));

    expect(registrarPagamento).toHaveBeenCalledWith("p1", undefined);
    expect(await screen.findByText("Pagamento registrado.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listarPagamentos).toHaveBeenCalledTimes(2);
  });

  it("registra o pagamento com a data informada", async () => {
    vi.mocked(registrarPagamento).mockResolvedValue({ ...fulano, status: "PAGO" });
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Registrar pagamento de Fulano Silva" }));
    fireEvent.change(screen.getByLabelText("Data do pagamento"), { target: { value: "2026-11-05" } });
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(registrarPagamento).toHaveBeenCalledWith("p1", "2026-11-05");
    expect(await screen.findByText("Pagamento registrado.")).toBeInTheDocument();
  });

  it("limpa a data do pagamento a cada vez que a confirmação abre", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Registrar pagamento de Fulano Silva" }));
    fireEvent.change(screen.getByLabelText("Data do pagamento"), { target: { value: "2026-11-05" } });
    await usuario.click(screen.getByRole("button", { name: "Voltar" }));
    await usuario.click(screen.getByRole("button", { name: "Registrar pagamento de Beltrana Souza" }));

    expect(screen.getByLabelText("Data do pagamento")).toHaveValue("");
  });

  it("cancela o pagamento depois de confirmar, avisa e recarrega", async () => {
    vi.mocked(cancelarPagamento).mockResolvedValue({ ...beltrana, status: "CANCELADO" });
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Beltrana Souza");

    await usuario.click(screen.getByRole("button", { name: "Cancelar pagamento de Beltrana Souza" }));
    const dialogo = screen.getByRole("dialog", { name: "Cancelar pagamento" });
    expect(
      within(dialogo).getByText(
        /Cancelar o pagamento de R\$\s89,90 de Beltrana Souza, com vencimento em 20\/10\/2026\?/,
      ),
    ).toBeInTheDocument();
    expect(within(dialogo).queryByLabelText("Data do pagamento")).toBeNull();
    await usuario.click(within(dialogo).getByRole("button", { name: "Confirmar" }));

    expect(cancelarPagamento).toHaveBeenCalledWith("p2");
    expect(await screen.findByText("Pagamento cancelado.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listarPagamentos).toHaveBeenCalledTimes(2);
  });

  it("fecha a confirmação em Voltar sem chamar a API", async () => {
    renderizar();
    await screen.findByText("Fulano Silva");

    await userEvent.click(screen.getByRole("button", { name: "Cancelar pagamento de Fulano Silva" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Voltar" }));

    expect(cancelarPagamento).not.toHaveBeenCalled();
    expect(registrarPagamento).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mostra o erro 409 da baixa num toast, fecha a confirmação e recarrega", async () => {
    vi.mocked(registrarPagamento).mockRejectedValue(new ApiError(409, "Pagamento já foi pago"));
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Registrar pagamento de Fulano Silva" }));
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByText("Pagamento já foi pago")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listarPagamentos).toHaveBeenCalledTimes(2);
  });

  it("mostra o erro 409 do cancelamento num toast", async () => {
    vi.mocked(cancelarPagamento).mockRejectedValue(
      new ApiError(409, "Pagamento já pago não pode ser cancelado"),
    );
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Cancelar pagamento de Fulano Silva" }));
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByText("Pagamento já pago não pode ser cancelado")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listarPagamentos).toHaveBeenCalledTimes(2);
  });

  it("um pedido que termina tarde não fecha outra confirmação", async () => {
    let terminar: (p: Pagamento) => void = () => {};
    vi.mocked(cancelarPagamento).mockReturnValue(
      new Promise<Pagamento>((resolve) => {
        terminar = resolve;
      }),
    );
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Cancelar pagamento de Fulano Silva" }));
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));
    await usuario.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Voltar" }));
    await usuario.click(screen.getByRole("button", { name: "Registrar pagamento de Beltrana Souza" }));
    terminar({ ...fulano, status: "CANCELADO" });

    expect(await screen.findByText("Pagamento cancelado.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Registrar pagamento" })).toBeInTheDocument();
  });

  it("abre o formulário de novo pagamento e fecha em Cancelar sem chamar a API", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Novo pagamento" }));
    const dialogo = screen.getByRole("dialog", { name: "Novo pagamento" });
    expect(within(dialogo).getByLabelText("Membro")).toBeInTheDocument();
    expect(within(dialogo).getByLabelText("Valor")).toBeInTheDocument();
    expect(within(dialogo).getByLabelText("Vencimento")).toBeInTheDocument();
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(criarPagamento).not.toHaveBeenCalled();
  });

  it("lança o pagamento, avisa, fecha o formulário e recarrega a lista", async () => {
    vi.mocked(buscarMembros).mockResolvedValue([
      { id: "m-novo", nome: "Eliana Prado", cpf: "11122233396" },
    ]);
    vi.mocked(criarPagamento).mockResolvedValue({ ...fulano, id: "p9" });
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Novo pagamento" }));
    const dialogo = screen.getByRole("dialog", { name: "Novo pagamento" });
    await usuario.type(within(dialogo).getByLabelText("Membro"), "Eli");
    await usuario.click(await within(dialogo).findByRole("button", { name: /Eliana Prado/ }));
    await usuario.type(within(dialogo).getByLabelText("Valor"), "8990");
    fireEvent.change(within(dialogo).getByLabelText("Vencimento"), { target: { value: "2026-11-20" } });
    await usuario.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(criarPagamento).toHaveBeenCalledWith({
      membroId: "m-novo",
      valor: 89.9,
      dataVencimento: "2026-11-20",
    });
    expect(await screen.findByText("Pagamento lançado.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listarPagamentos).toHaveBeenCalledTimes(2);
  });

  it("um lançamento que termina tarde não fecha o formulário reaberto", async () => {
    vi.mocked(buscarMembros).mockResolvedValue([
      { id: "m-novo", nome: "Eliana Prado", cpf: "11122233396" },
    ]);
    let terminar: (p: Pagamento) => void = () => {};
    vi.mocked(criarPagamento).mockReturnValue(
      new Promise<Pagamento>((resolve) => {
        terminar = resolve;
      }),
    );
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Novo pagamento" }));
    await usuario.type(screen.getByLabelText("Membro"), "Eli");
    await usuario.click(await screen.findByRole("button", { name: /Eliana Prado/ }));
    await usuario.type(screen.getByLabelText("Valor"), "8990");
    fireEvent.change(screen.getByLabelText("Vencimento"), { target: { value: "2026-11-20" } });
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));
    await usuario.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));
    await usuario.click(screen.getByRole("button", { name: "Novo pagamento" }));
    terminar({ ...fulano, id: "p9" });

    expect(await screen.findByText("Pagamento lançado.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Novo pagamento" })).toBeInTheDocument();
  });

  it("mostra Acesso restrito e não chama a API para o instrutor", () => {
    renderizar({ tipo: "FUNCIONARIO", cargo: "INSTRUTOR" });

    expect(screen.getByText("Acesso restrito")).toBeInTheDocument();
    expect(listarPagamentos).not.toHaveBeenCalled();
  });

  it("mostra Acesso restrito para aluno", () => {
    renderizar({ tipo: "ALUNO" });

    expect(screen.getByText("Acesso restrito")).toBeInTheDocument();
    expect(listarPagamentos).not.toHaveBeenCalled();
  });

  it("libera a tela para o ADMIN", async () => {
    renderizar({ tipo: "FUNCIONARIO", cargo: "ADMIN" });

    expect(await screen.findByText("Fulano Silva")).toBeInTheDocument();
  });
});
