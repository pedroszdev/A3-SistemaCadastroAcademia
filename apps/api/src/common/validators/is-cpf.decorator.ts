import { ValidateBy, ValidationOptions } from 'class-validator';
import { isCpfValido } from './cpf';

// Só valida. Para guardar só os números (RN01), o DTO normaliza com
// `@Transform` e `normalizarCpf`.

export function IsCpf(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isCpf',
      validator: {
        validate: (valor) => isCpfValido(valor),
        defaultMessage: () => '$property deve ser um CPF válido',
      },
    },
    options,
  );
}
