import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';
import { NaoAnteriorA } from '../../common/validators/nao-anterior-a.decorator';

// Filtros das rotas em que o membro vem do path, como GET /membros/:id/atividades.
// Sem membroId aqui, a whitelist recusa o campo na query em vez de ignorá-lo.
export class QueryAtividadeMembroDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'funcionarioId deve ser um UUID válido' })
  funcionarioId?: string;

  @IsOptional()
  @IsDataCalendario()
  dataDe?: Date;

  @IsOptional()
  @IsDataCalendario()
  @NaoAnteriorA('dataDe')
  dataAte?: Date;
}

export class QueryAtividadeDto extends QueryAtividadeMembroDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'membroId deve ser um UUID válido' })
  membroId?: string;
}
