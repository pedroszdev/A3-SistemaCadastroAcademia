import { Transform } from 'class-transformer';
import {
  IsByteLength,
  IsEnum,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { aparar } from '../../common/utils/aparar';
import { SeVeio } from '../../common/validators/se-veio.decorator';
import { Cargo } from '../../generated/prisma/enums';

// login não entra no body: é imutável, e a whitelist rejeita o campo.
export class UpdateFuncionarioDto {
  @SeVeio()
  @Transform(aparar)
  @IsString({ message: 'nome deve ser um texto' })
  @Length(3, 100, { message: 'nome deve ter entre 3 e 100 caracteres' })
  nome?: string;

  @SeVeio()
  @IsEnum(Cargo, {
    message: 'cargo deve ser ADMIN, RECEPCIONISTA ou INSTRUTOR',
  })
  cargo?: Cargo;

  @SeVeio()
  @IsString({ message: 'senha deve ser um texto' })
  @MinLength(8, { message: 'senha deve ter no mínimo 8 caracteres' })
  @IsByteLength(0, 72, { message: 'senha deve ter no máximo 72 bytes' })
  senha?: string;
}
