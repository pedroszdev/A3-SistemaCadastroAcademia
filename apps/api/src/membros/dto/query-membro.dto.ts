import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { aparar } from '../../common/utils/aparar';
import { paraBooleano } from '../../common/utils/para-booleano';

export class QueryMembroDto extends PaginationQueryDto {
  // Nome parcial (sem diferenciar maiúsculas) ou CPF, com ou sem máscara.
  @IsOptional()
  @Transform(aparar)
  @IsString({ message: 'busca deve ser um texto' })
  @MaxLength(120, { message: 'busca deve ter no máximo 120 caracteres' })
  busca?: string;

  @IsOptional()
  @Transform(paraBooleano)
  @IsBoolean({ message: 'ativo deve ser true ou false' })
  ativo?: boolean;
}
