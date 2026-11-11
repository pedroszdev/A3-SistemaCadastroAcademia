import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { MENSAGEM_TIPO_TREINO, TIPOS_TREINO } from '../tipos-treino';
import type { TipoTreino } from '../tipos-treino';

// Sem membroId: usado onde o membro vem do path ou do token.
export class QueryTreinoMembroDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(TIPOS_TREINO, { message: MENSAGEM_TIPO_TREINO })
  tipo?: TipoTreino;
}

export class QueryTreinoDto extends QueryTreinoMembroDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'membroId deve ser um UUID válido' })
  membroId?: string;
}
