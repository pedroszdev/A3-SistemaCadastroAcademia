import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';
import { NaoAnteriorA } from '../../common/validators/nao-anterior-a.decorator';

export class QueryAtividadeDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'membroId deve ser um UUID válido' })
  membroId?: string;

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
