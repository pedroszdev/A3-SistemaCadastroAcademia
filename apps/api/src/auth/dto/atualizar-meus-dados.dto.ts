import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';
import { aparar } from '../../common/utils/aparar';
import {
  MENSAGEM_TELEFONE,
  normalizarTelefone,
} from '../../common/utils/telefone';
import { SeVeio } from '../../common/validators/se-veio.decorator';

// RN20: o que cada um muda nos próprios dados. O funcionário muda o nome; o aluno, o
// telefone e o endereço. O service recusa o campo que não é do tipo de quem pediu.
// CPF, login e cargo ficam de fora e a whitelist recusa.
export class AtualizarMeusDadosDto {
  @SeVeio()
  @Transform(aparar)
  @IsString({ message: 'nome deve ser um texto' })
  @Length(3, 100, { message: 'nome deve ter entre 3 e 100 caracteres' })
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
}
