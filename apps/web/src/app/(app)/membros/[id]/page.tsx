import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Trilha } from "@/components/layout/trilha";
import { FichaMembro } from "@/features/membros/ficha-membro";

export const metadata = { title: "Ficha do membro · Academia" };

export default async function FichaMembroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <CabecalhoPagina
        titulo="Ficha do membro"
        descricao="Dados, treinos, pagamentos e histórico do aluno."
      />
      <Trilha passos={[{ rotulo: "Membros", href: "/membros" }, { rotulo: "Ficha do membro" }]} />
      <FichaMembro id={id} />
    </>
  );
}
