import { Transform } from 'class-transformer';
import {
  IsAlphanumeric,
  IsByteLength,
  IsEnum,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { aparar } from '../../common/utils/aparar';
import { Cargo } from '../../generated/prisma/enums';

export class CreateFuncionarioDto {
  @Transform(aparar)
  @IsString({ message: 'nome deve ser um texto' })
  @Length(3, 100, { message: 'nome deve ter entre 3 e 100 caracteres' })
  nome!: string;

  @IsEnum(Cargo, {
    message: 'cargo deve ser ADMIN, RECEPCIONISTA ou INSTRUTOR',
  })
  cargo!: Cargo;

  @Transform(aparar)
  @IsString({ message: 'login deve ser um texto' })
  @Length(3, 30, { message: 'login deve ter entre 3 e 30 caracteres' })
  @IsAlphanumeric(undefined, {
    message: 'login deve ter apenas letras e números',
  })
  login!: string;

  // O bcrypt ignora em silêncio o que passa de 72 bytes; acentos ocupam 2.
  @IsString({ message: 'senha deve ser um texto' })
  @MinLength(8, { message: 'senha deve ter no mínimo 8 caracteres' })
  @IsByteLength(0, 72, { message: 'senha deve ter no máximo 72 bytes' })
  senha!: string;
}
