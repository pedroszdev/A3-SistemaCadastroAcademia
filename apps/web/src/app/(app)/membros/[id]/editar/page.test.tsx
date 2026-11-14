import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EditarMembroPage from "./page";

vi.mock("@/features/membros/cadastro-membro", () => ({
  EditarMembro: ({ id }: { id: string }) => <p>editar {id}</p>,
}));

describe("EditarMembroPage", () => {
  it("mostra o título e repassa o id da rota", async () => {
    render(await EditarMembroPage({ params: Promise.resolve({ id: "m1" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Editar membro" })).toBeInTheDocument();
    expect(screen.getByText("editar m1")).toBeInTheDocument();
  });
});
