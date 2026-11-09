import { TelaPagamentos } from "@/features/pagamentos/tela-pagamentos";

export const metadata = { title: "Pagamentos · Academia" };

export default function PagamentosPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Pagamentos</h1>
      <TelaPagamentos />
    </div>
  );
}
