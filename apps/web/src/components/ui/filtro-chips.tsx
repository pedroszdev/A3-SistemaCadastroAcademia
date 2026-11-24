type Opcao<T extends string> = { valor: T; rotulo: string };

type FiltroChipsProps<T extends string> = {
  // Nome do grupo para leitor de tela (ex.: "Situação").
  rotulo: string;
  opcoes: readonly Opcao<T>[];
  // undefined: a opção "Todos" está marcada.
  valor: T | undefined;
  onMudar: (valor: T | undefined) => void;
  // Texto da opção sem filtro; null tira a opção.
  rotuloTodos?: string | null;
  // "Todos" vai no fim (como no filtro de situação) ou no começo.
  todosNoFim?: boolean;
};

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`min-h-10 cursor-pointer rounded-full border px-4 text-sm font-medium ${
        ativo
          ? "border-tinta bg-tinta text-white"
          : "border-borda bg-white text-tinta hover:bg-fundo-2"
      }`}
    >
      {children}
    </button>
  );
}

export function FiltroChips<T extends string>({
  rotulo,
  opcoes,
  valor,
  onMudar,
  rotuloTodos = "Todos",
  todosNoFim = false,
}: FiltroChipsProps<T>) {
  const todos = rotuloTodos && (
    <Chip key="__todos" ativo={valor === undefined} onClick={() => onMudar(undefined)}>
      {rotuloTodos}
    </Chip>
  );

  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-2">
      {!todosNoFim && todos}
      {opcoes.map((opcao) => (
        <Chip key={opcao.valor} ativo={valor === opcao.valor} onClick={() => onMudar(opcao.valor)}>
          {opcao.rotulo}
        </Chip>
      ))}
      {todosNoFim && todos}
    </div>
  );
}

// Fileira acima da tabela: busca à esquerda, filtros à direita.
export function BarraDeFiltros({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-3">{children}</div>;
}
