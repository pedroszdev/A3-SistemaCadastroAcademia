import { IsByteLength, IsString, MinLength } from 'class-validator';

// RN15: senha do aluno, definida pela recepção ou pelo admin ao liberar o
// acesso ou ao redefinir. O bcrypt ignora em silêncio o que passa de 72
// bytes; acentos ocupam 2.
export class LiberarAcessoDto {
  @IsString({ message: 'senha deve ser um texto' })
  @MinLength(8, { message: 'senha deve ter no mínimo 8 caracteres' })
  @IsByteLength(0, 72, { message: 'senha deve ter no máximo 72 bytes' })
  senha!: string;
}
