import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { normalizarCpf } from '../../common/validators/cpf';

// Só confere o formato do corpo: CPF ou senha fora das regras de cadastro caem
// no 401 genérico do login, não num 400 que revela essas regras (RN12).
export class LoginAlunoDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizarCpf(value) : value,
  )
  @IsString({ message: 'cpf deve ser um texto' })
  @IsNotEmpty({ message: 'cpf é obrigatório' })
  cpf!: string;

  @IsString({ message: 'senha deve ser um texto' })
  @IsNotEmpty({ message: 'senha é obrigatória' })
  senha!: string;
}
