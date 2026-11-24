import { applyDecorators } from '@nestjs/common';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

// RN18: mesmos limites de valor de um pagamento (RN06).
export function ValorMensalidade() {
  return applyDecorators(
    IsNumber(
      { maxDecimalPlaces: 2 },
      {
        message:
          'valorMensalidade deve ser um número com no máximo 2 casas decimais',
      },
    ),
    Min(0.01, { message: 'valorMensalidade deve ser no mínimo 0,01' }),
    Max(10000, { message: 'valorMensalidade deve ser no máximo 10.000' }),
  );
}

// Dia 29, 30 ou 31 vence no último dia nos meses mais curtos.
export function DiaVencimento() {
  return applyDecorators(
    IsInt({ message: 'diaVencimento deve ser um número inteiro' }),
    Min(1, { message: 'diaVencimento deve ser entre 1 e 31' }),
    Max(31, { message: 'diaVencimento deve ser entre 1 e 31' }),
  );
}
