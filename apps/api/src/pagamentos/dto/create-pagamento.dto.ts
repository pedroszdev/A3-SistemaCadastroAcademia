import { IsNumber, IsUUID, Max, Min } from 'class-validator';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';

export class CreatePagamentoDto {
  @IsUUID(undefined, { message: 'membroId deve ser um UUID válido' })
  membroId!: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'valor deve ser um número com no máximo 2 casas decimais' },
  )
  @Min(0.01, { message: 'valor deve ser no mínimo 0,01' })
  @Max(10000, { message: 'valor deve ser no máximo 10.000' })
  valor!: number;

  @IsDataCalendario()
  dataVencimento!: Date;
}
