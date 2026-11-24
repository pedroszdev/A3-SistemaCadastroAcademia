import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  STATUS_FILTRO_PAGAMENTO,
  type StatusFiltroPagamento,
} from './query-pagamento.dto';

// RN16: sem membroId, que vem do token; mandar o campo dá 400 pela whitelist.
export class QueryMeusPagamentosDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(STATUS_FILTRO_PAGAMENTO, {
    message: 'status deve ser PENDENTE, PAGO, ATRASADO ou CANCELADO',
  })
  status?: StatusFiltroPagamento;
}
