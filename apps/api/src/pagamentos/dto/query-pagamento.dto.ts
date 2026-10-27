import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IsDataCalendario } from '../../common/validators/is-data-calendario.decorator';

// O filtro aceita ATRASADO, que é calculado (RN07) e não existe no banco.
export const STATUS_FILTRO_PAGAMENTO = [
  'PENDENTE',
  'PAGO',
  'ATRASADO',
  'CANCELADO',
] as const;

export type StatusFiltroPagamento = (typeof STATUS_FILTRO_PAGAMENTO)[number];

export class QueryPagamentoDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'membroId deve ser um UUID válido' })
  membroId?: string;

  @IsOptional()
  @IsIn(STATUS_FILTRO_PAGAMENTO, {
    message: 'status deve ser PENDENTE, PAGO, ATRASADO ou CANCELADO',
  })
  status?: StatusFiltroPagamento;

  @IsOptional()
  @IsDataCalendario()
  vencimentoDe?: Date;

  @IsOptional()
  @IsDataCalendario()
  vencimentoAte?: Date;
}
