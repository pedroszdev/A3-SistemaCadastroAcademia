import { FichaMembro } from "@/features/membros/ficha-membro";

export const metadata = { title: "Ficha do membro · Academia" };

export default async function FichaMembroPage({ params }: PageProps<"/membros/[id]">) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Ficha do membro</h1>
      <FichaMembro membroId={id} />
    </div>
  );
}
