import { Transform } from 'class-transformer';
import {
  Equals,
  IsIn,
  IsInt,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { aparar } from '../../common/utils/aparar';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';
import { SeVeio } from '../../common/validators/se-veio.decorator';
import {
  MENSAGEM_TIPO_TREINO,
  TIPOS_TREINO,
  TipoTreino,
} from '../tipos-treino';

export class UpdateTreinoDto {
  @SeVeio()
  @IsIn(TIPOS_TREINO, { message: MENSAGEM_TIPO_TREINO })
  tipo?: TipoTreino;

  @SeVeio()
  @Transform(aparar)
  @IsString({ message: 'descricao deve ser um texto' })
  @Length(3, 500, { message: 'descricao deve ter entre 3 e 500 caracteres' })
  descricao?: string;

  @SeVeio()
  @IsInt({ message: 'duracao deve ser um número inteiro de minutos' })
  @Min(1, { message: 'duracao deve ser no mínimo 1 minuto' })
  @Max(300, { message: 'duracao deve ser no máximo 300 minutos' })
  duracao?: number;

  @SeVeio()
  @IsDataCalendario()
  dataInicio?: Date;

  // O treino não troca de membro depois de criado. Declarado só para responder
  // 400 com uma mensagem clara, em vez do genérico da whitelist. O
  // @Equals(undefined) recusa qualquer valor enviado, inclusive "" e null.
  @Equals(undefined, { message: 'membroId não pode ser alterado' })
  membroId?: never;
}
