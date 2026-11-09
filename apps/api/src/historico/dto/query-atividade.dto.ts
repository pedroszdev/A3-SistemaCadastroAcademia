import { applyDecorators } from '@nestjs/common';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';
import { NaoAnteriorA } from '../../common/validators/nao-anterior-a.decorator';

// Regra do período num lugar só, usada pelos DTOs com e sem paginação.
const DataDe = () => applyDecorators(IsOptional(), IsDataCalendario());
const DataAte = () =>
  applyDecorators(IsOptional(), IsDataCalendario(), NaoAnteriorA('dataDe'));

// Período de GET /me/atividades/resumo. Sem paginação, então a whitelist recusa `page`.
export class PeriodoAtividadeDto {
  @DataDe()
  dataDe?: Date;

  @DataAte()
  dataAte?: Date;
}

// Filtros de GET /me/atividades, em que o membro vem do token (RN16).
// Sem membroId nem funcionarioId aqui, a whitelist recusa os campos na query em vez de ignorá-los.
export class QueryMinhasAtividadesDto extends PaginationQueryDto {
  @DataDe()
  dataDe?: Date;

  @DataAte()
  dataAte?: Date;
}

// Filtros das rotas em que o membro vem do path, como GET /membros/:id/atividades.
// Sem membroId aqui, a whitelist recusa o campo na query em vez de ignorá-lo.
export class QueryAtividadeMembroDto extends QueryMinhasAtividadesDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'funcionarioId deve ser um UUID válido' })
  funcionarioId?: string;
}

export class QueryAtividadeDto extends QueryAtividadeMembroDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'membroId deve ser um UUID válido' })
  membroId?: string;
}
