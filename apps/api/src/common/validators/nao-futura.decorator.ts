import { ValidateBy, ValidationOptions } from 'class-validator';
import { diasEntre, hoje } from '../utils/date';

export function naoFutura(valor: unknown): boolean {
  if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) {
    return true;
  }
  return diasEntre(valor, hoje()) >= 0;
}

export function NaoFutura(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'naoFutura',
      validator: {
        validate: (valor) => naoFutura(valor),
        defaultMessage: () => '$property não pode ser uma data futura',
      },
    },
    options,
  );
}
