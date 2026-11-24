import { TelaPagamentos } from "@/features/pagamentos/tela-pagamentos";

export const metadata = { title: "Pagamentos · Academia" };

export default function PagamentosPage() {
  return (
    <TelaPagamentos
      cabecalho={{
        titulo: "Pagamentos",
        descricao: "Mensalidades dos membros. Visível só para administrador e recepção.",
      }}
    />
  );
}
