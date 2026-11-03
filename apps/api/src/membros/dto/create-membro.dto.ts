import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';
import { IsCpf } from '../../common/validators/is-cpf.decorator';
import { aparar } from '../../common/utils/aparar';

// Telefone é guardado só com os números: (48) 99999-1234 → 48999991234.
export function normalizarTelefone({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.replace(/[\s().+-]/g, '') : value;
}

export const MENSAGEM_TELEFONE =
  'telefone deve ter 10 ou 11 dígitos, com o DDD';

export class CreateMembroDto {
  @Transform(aparar)
  @IsString({ message: 'nome deve ser um texto' })
  @Length(3, 120, { message: 'nome deve ter entre 3 e 120 caracteres' })
  nome!: string;

  // RN01: o @IsCpf já normaliza para só os números.
  @IsCpf()
  cpf!: string;

  @Transform(normalizarTelefone)
  @IsString({ message: 'telefone deve ser um texto' })
  @Matches(/^\d{10,11}$/, { message: MENSAGEM_TELEFONE })
  telefone!: string;

  @Transform(aparar)
  @IsString({ message: 'endereco deve ser um texto' })
  @Length(5, 200, { message: 'endereco deve ter entre 5 e 200 caracteres' })
  endereco!: string;
}
