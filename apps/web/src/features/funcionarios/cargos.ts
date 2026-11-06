import type { Cargo } from "@/lib/sessao";

export const ROTULO_CARGO: Record<Cargo, string> = {
  ADMIN: "Administrador",
  RECEPCIONISTA: "Recepcionista",
  INSTRUTOR: "Instrutor",
};

export const OPCOES_CARGO = Object.entries(ROTULO_CARGO).map(([valor, rotulo]) => ({
  valor,
  rotulo,
}));
