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

// RN19: o aluno registra a própria atividade, sempre num treino dele. membroId vem
// do token (RN16) e a whitelist recusa o campo no body.
export class CreateAtividadeAlunoDto {
  @IsUUID(undefined, { message: 'treinoId deve ser um UUID válido' })
  treinoId!: string;

  // Sem texto, a atividade leva a descrição do treino.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'atividade deve ser um texto' })
  @Length(3, 120, { message: 'atividade deve ter entre 3 e 120 caracteres' })
  atividade?: string;

  @IsDataCalendario()
  @NaoFutura()
  data!: Date;

  @IsInt({ message: 'tempoExecucao deve ser um número inteiro de minutos' })
  @Min(1, { message: 'tempoExecucao deve ser no mínimo 1 minuto' })
  @Max(600, { message: 'tempoExecucao deve ser no máximo 600 minutos' })
  tempoExecucao!: number;
}
