import type { Metadata } from "next";
import { Marca } from "@/components/layout/marca";
import { FormLogin } from "@/features/auth/form-login";

export const metadata: Metadata = { title: "Entrar · Academia" };

const PERFIS = ["Administrador", "Recepcionista", "Instrutor", "Aluno"];

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-wrap">
      <section className="flex flex-[1_1_480px] flex-col justify-between gap-12 bg-tinta px-6 py-12 text-white sm:px-14">
        <Marca tamanho="grande" />
        <div className="max-w-[520px]">
          <p className="mb-4 text-[13px] font-semibold tracking-[0.1em] text-lima uppercase">
            Sistema de cadastro
          </p>
          <p className="font-display text-4xl leading-[1.02] font-bold tracking-[-0.03em] sm:text-[56px]">
            Membros, treinos e mensalidades no mesmo lugar.
          </p>
          <p className="mt-5 text-[17px] leading-relaxed text-suave-escuro">
            A recepção cadastra e cobra, o instrutor monta a ficha e registra a atividade, e o
            aluno acompanha o próprio histórico.
          </p>
        </div>
        <ul aria-label="Perfis de acesso" className="flex flex-wrap gap-2.5">
          {PERFIS.map((perfil) => (
            <li
              key={perfil}
              className="rounded-full border border-tinta-borda px-3.5 py-2 text-[13px] text-suave-escuro"
            >
              {perfil}
            </li>
          ))}
        </ul>
      </section>
      <main className="flex flex-[1_1_480px] items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-[420px] flex-col gap-7">
          <div>
            <h1 className="font-display text-[30px] font-bold tracking-[-0.02em]">Entrar</h1>
            <p className="mt-2 text-[15px] text-suave">Escolha como você vai acessar o sistema.</p>
          </div>
          <FormLogin />
        </div>
      </main>
    </div>
  );
}
