import { ValidateBy, ValidationOptions } from 'class-validator';
import { diasEntre, hoje } from '../utils/date';

// Limita só o passado: uma data futura passa, e quem precisa barrá-la usa `NaoFutura`.
export function dentroDosUltimosDias(valor: unknown, dias: number): boolean {
  if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) {
    return true;
  }
  return diasEntre(valor, hoje()) <= dias;
}

export function DentroDosUltimosDias(
  dias: number,
  options?: ValidationOptions,
) {
  return ValidateBy(
    {
      name: 'dentroDosUltimosDias',
      constraints: [dias],
      validator: {
        validate: (valor) => dentroDosUltimosDias(valor, dias),
        defaultMessage: () =>
          '$property não pode ter mais de $constraint1 dias no passado',
      },
    },
    options,
  );
}
