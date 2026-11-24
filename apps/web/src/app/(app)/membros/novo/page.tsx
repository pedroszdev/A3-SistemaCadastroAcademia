import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Trilha } from "@/components/layout/trilha";
import { NovoMembro } from "@/features/membros/cadastro-membro";

export const metadata = { title: "Novo membro · Academia" };

export default function NovoMembroPage() {
  return (
    <>
      <CabecalhoPagina
        titulo="Novo membro"
        descricao="Preencha os dados para cadastrar um aluno."
      />
      <Trilha passos={[{ rotulo: "Membros", href: "/membros" }, { rotulo: "Novo membro" }]} />
      <NovoMembro />
    </>
  );
}
