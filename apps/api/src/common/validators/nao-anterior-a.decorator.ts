import { ValidateBy, ValidationOptions } from 'class-validator';

function dataValida(valor: unknown): valor is Date {
  return valor instanceof Date && !Number.isNaN(valor.getTime());
}

// Só compara duas datas válidas: campo ausente ou inválido é problema dos outros validadores.
export function naoAnteriorA(valor: unknown, referencia: unknown): boolean {
  if (!dataValida(valor) || !dataValida(referencia)) {
    return true;
  }
  return valor.getTime() >= referencia.getTime();
}

export function NaoAnteriorA(campo: string, options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'naoAnteriorA',
      constraints: [campo],
      validator: {
        validate: (valor, args) =>
          naoAnteriorA(
            valor,
            (args?.object as Record<string, unknown> | undefined)?.[campo],
          ),
        defaultMessage: () => '$property não pode ser anterior a $constraint1',
      },
    },
    options,
  );
}
