"use client";

import { type ReactNode, createContext, useContext } from "react";
import type { UsuarioDoToken } from "@/lib/sessao";

const UsuarioContext = createContext<UsuarioDoToken | null>(null);

export function UsuarioProvider({
  usuario,
  children,
}: {
  usuario: UsuarioDoToken;
  children: ReactNode;
}) {
  return <UsuarioContext value={usuario}>{children}</UsuarioContext>;
}

// Só para a interface (esconder botões, por exemplo); quem barra de verdade é a API.
export function useUsuario(): UsuarioDoToken {
  const usuario = useContext(UsuarioContext);
  if (!usuario) {
    throw new Error("useUsuario precisa estar dentro de um UsuarioProvider");
  }
  return usuario;
}
