import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { ValidateBy, ValidationOptions } from 'class-validator';
import { isCpfValido, normalizarCpf } from './cpf';

// RN01: normaliza para só os números e valida. O DTO usa só o @IsCpf(), sem
// @Transform próprio. O que não é texto chega intacto ao validador e vira 400.

export function IsCpf(options?: ValidationOptions) {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? normalizarCpf(value) : value,
    ),
    ValidateBy(
      {
        name: 'isCpf',
        validator: {
          validate: (valor) => isCpfValido(valor),
          defaultMessage: () => '$property deve ser um CPF válido',
        },
      },
      options,
    ),
  );
}
