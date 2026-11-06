import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { aparar } from '../../common/utils/aparar';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';
import {
  MENSAGEM_TIPO_TREINO,
  TIPOS_TREINO,
  TipoTreino,
} from '../tipos-treino';

export class CreateTreinoDto {
  @IsUUID(undefined, { message: 'membroId deve ser um UUID válido' })
  membroId!: string;

  @IsIn(TIPOS_TREINO, { message: MENSAGEM_TIPO_TREINO })
  tipo!: TipoTreino;

  @Transform(aparar)
  @IsString({ message: 'descricao deve ser um texto' })
  @Length(3, 500, { message: 'descricao deve ter entre 3 e 500 caracteres' })
  descricao!: string;

  @IsInt({ message: 'duracao deve ser um número inteiro de minutos' })
  @Min(1, { message: 'duracao deve ser no mínimo 1 minuto' })
  @Max(300, { message: 'duracao deve ser no máximo 300 minutos' })
  duracao!: number;

  // RN05: não ser anterior a hoje é checado no service (TRE-02).
  @IsDataCalendario()
  dataInicio!: Date;
}
