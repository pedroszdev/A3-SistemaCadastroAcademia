import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsDate, isISO8601, ValidationOptions } from 'class-validator';

// Recebe `AAAA-MM-DD` e converte para a meia-noite UTC do dia, a convenção de
// `common/utils/date.ts`.

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

export function paraDataCalendario(valor: unknown): unknown {
  if (
    typeof valor === 'string' &&
    FORMATO_DATA.test(valor) &&
    isISO8601(valor, { strict: true })
  ) {
    return new Date(`${valor}T00:00:00.000Z`);
  }
  return valor;
}

export function IsDataCalendario(options?: ValidationOptions) {
  return applyDecorators(
    Transform(({ value }) => paraDataCalendario(value)),
    IsDate({
      message: '$property deve ser uma data válida no formato AAAA-MM-DD',
      ...options,
    }),
  );
}
