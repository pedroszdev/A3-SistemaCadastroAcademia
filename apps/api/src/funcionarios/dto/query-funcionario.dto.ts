import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Cargo } from '../../generated/prisma/enums';

export class QueryFuncionarioDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(Cargo, {
    message: 'cargo deve ser ADMIN, RECEPCIONISTA ou INSTRUTOR',
  })
  cargo?: Cargo;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'ativo deve ser true ou false' })
  ativo?: boolean;
}
