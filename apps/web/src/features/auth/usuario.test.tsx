import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UsuarioProvider, useUsuario } from "./usuario";

function Cargo() {
  const usuario = useUsuario();
  return <p>{usuario.tipo === "FUNCIONARIO" ? usuario.cargo : "aluno"}</p>;
}

describe("useUsuario", () => {
  it("devolve o usuário do provider", () => {
    render(
      <UsuarioProvider usuario={{ tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" }}>
        <Cargo />
      </UsuarioProvider>,
    );

    expect(screen.getByText("RECEPCIONISTA")).toBeInTheDocument();
  });

  it("lança erro fora do provider", () => {
    expect(() => renderHook(() => useUsuario())).toThrow(
      "useUsuario precisa estar dentro de um UsuarioProvider",
    );
  });
});
