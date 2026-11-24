import type { ReactNode } from "react";

// "Ana Souza" → "AS"; "Recepção" → "R". Só letras: números e símbolos não viram iniciais.
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter((p) => /\p{L}/u.test(p));
  if (partes.length === 0) return "?";
  const primeira = partes[0].match(/\p{L}/u)?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes.at(-1)?.match(/\p{L}/u)?.[0] ?? "") : "";
  return `${primeira}${ultima}`.toUpperCase();
}

export function Avatar({ nome }: { nome: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-[34px] flex-none items-center justify-center rounded-full bg-avatar text-xs font-bold text-tinta"
    >
      {iniciais(nome)}
    </span>
  );
}

// Célula de tabela com o avatar e o nome em negrito.
export function Pessoa({ nome, children }: { nome: string; children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Avatar nome={nome} />
      <span className="font-semibold">{children ?? nome}</span>
    </span>
  );
}
