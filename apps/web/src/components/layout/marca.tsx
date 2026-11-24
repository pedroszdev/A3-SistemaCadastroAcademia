import { Icone } from "@/components/ui/icone";

// Logotipo do design: o raio no quadrado lima e o nome da academia.
export function Marca({ tamanho = "normal" }: { tamanho?: "normal" | "grande" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-[34px] items-center justify-center rounded-[9px] bg-lima text-tinta">
        <Icone nome="raio" espessura={2} />
      </span>
      <span
        className={`font-display font-bold tracking-[-0.02em] text-white ${tamanho === "grande" ? "text-[22px]" : "text-xl"}`}
      >
        Academia Forma
      </span>
    </div>
  );
}
