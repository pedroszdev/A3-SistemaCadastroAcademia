import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';
import { NaoFutura } from '../../common/validators/nao-futura.decorator';

// funcionarioId não entra no body: vem do token (RN11), e a whitelist rejeita o campo.
export class CreateAtividadeDto {
  @IsUUID(undefined, { message: 'membroId deve ser um UUID válido' })
  membroId!: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'treinoId deve ser um UUID válido' })
  treinoId?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'atividade deve ser um texto' })
  @Length(3, 120, { message: 'atividade deve ter entre 3 e 120 caracteres' })
  atividade!: string;

  @IsDataCalendario()
  @NaoFutura()
  data!: Date;

  @IsInt({ message: 'tempoExecucao deve ser um número inteiro de minutos' })
  @Min(1, { message: 'tempoExecucao deve ser no mínimo 1 minuto' })
  @Max(600, { message: 'tempoExecucao deve ser no máximo 600 minutos' })
  tempoExecucao!: number;
}
