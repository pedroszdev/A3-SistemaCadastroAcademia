import { IsNumber, IsUUID, Max, Min } from 'class-validator';
import { DentroDosUltimosDias } from '../../common/validators/dentro-dos-ultimos-dias.decorator';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';
import { DIAS_RETROATIVOS_MAX } from '../pagamento-status';

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
  @DentroDosUltimosDias(DIAS_RETROATIVOS_MAX)
  dataVencimento!: Date;
}
