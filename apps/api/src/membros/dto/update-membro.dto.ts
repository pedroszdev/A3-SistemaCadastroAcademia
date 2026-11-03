import { Transform } from 'class-transformer';
import {
  IsEmpty,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { aparar } from '../../common/utils/aparar';
import { MENSAGEM_TELEFONE, normalizarTelefone } from './create-membro.dto';

// Só pula a validação quando o campo não veio. O @IsOptional também deixa
// passar null, que o Prisma recusa nas colunas obrigatórias (vira 500).
const seVeio = ValidateIf((_, valor: unknown) => valor !== undefined);

export class UpdateMembroDto {
  @seVeio
  @Transform(aparar)
  @IsString({ message: 'nome deve ser um texto' })
  @Length(3, 120, { message: 'nome deve ter entre 3 e 120 caracteres' })
  nome?: string;

  @seVeio
  @Transform(normalizarTelefone)
  @IsString({ message: 'telefone deve ser um texto' })
  @Matches(/^\d{10,11}$/, { message: MENSAGEM_TELEFONE })
  telefone?: string;

  @seVeio
  @Transform(aparar)
  @IsString({ message: 'endereco deve ser um texto' })
  @Length(5, 200, { message: 'endereco deve ter entre 5 e 200 caracteres' })
  endereco?: string;

  // RN02: o CPF não muda depois do cadastro. Declarado só para responder
  // 400 com uma mensagem clara, em vez do genérico da whitelist.
  @seVeio
  @IsEmpty({ message: 'cpf não pode ser alterado' })
  cpf?: never;
}
