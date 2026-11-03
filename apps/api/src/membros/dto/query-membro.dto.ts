import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { aparar } from '../../common/utils/aparar';

export class QueryMembroDto extends PaginationQueryDto {
  // Nome parcial (sem diferenciar maiúsculas) ou CPF, com ou sem máscara.
  @IsOptional()
  @Transform(aparar)
  @IsString({ message: 'busca deve ser um texto' })
  @MaxLength(120, { message: 'busca deve ter no máximo 120 caracteres' })
  busca?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'ativo deve ser true ou false' })
  ativo?: boolean;
}
