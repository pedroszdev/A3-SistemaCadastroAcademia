import { Transform } from 'class-transformer';
import { Equals, IsString, Length, Matches } from 'class-validator';
import { aparar } from '../../common/utils/aparar';
import {
  MENSAGEM_TELEFONE,
  normalizarTelefone,
} from '../../common/utils/telefone';
import { SeVeio } from '../../common/validators/se-veio.decorator';

export class UpdateMembroDto {
  @SeVeio()
  @Transform(aparar)
  @IsString({ message: 'nome deve ser um texto' })
  @Length(3, 120, { message: 'nome deve ter entre 3 e 120 caracteres' })
  nome?: string;

  @SeVeio()
  @Transform(normalizarTelefone)
  @IsString({ message: 'telefone deve ser um texto' })
  @Matches(/^\d{10,11}$/, { message: MENSAGEM_TELEFONE })
  telefone?: string;

  @SeVeio()
  @Transform(aparar)
  @IsString({ message: 'endereco deve ser um texto' })
  @Length(5, 200, { message: 'endereco deve ter entre 5 e 200 caracteres' })
  endereco?: string;

  // RN02: o CPF não muda depois do cadastro. Declarado só para responder
  // 400 com uma mensagem clara, em vez do genérico da whitelist. O
  // @Equals(undefined) recusa qualquer valor enviado, inclusive "" e null
  // (o @IsEmpty deixava passar).
  @Equals(undefined, { message: 'cpf não pode ser alterado' })
  cpf?: never;
}
