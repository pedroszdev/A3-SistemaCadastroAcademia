import { IsByteLength, IsString, MinLength } from 'class-validator';

// RN20: a troca exige a senha atual. A nova segue a mesma regra da RN15.
export class TrocarSenhaDto {
  @IsString({ message: 'senhaAtual deve ser um texto' })
  @MinLength(1, { message: 'senhaAtual é obrigatória' })
  senhaAtual!: string;

  @IsString({ message: 'novaSenha deve ser um texto' })
  @MinLength(8, { message: 'novaSenha deve ter no mínimo 8 caracteres' })
  @IsByteLength(0, 72, { message: 'novaSenha deve ter no máximo 72 bytes' })
  novaSenha!: string;
}
