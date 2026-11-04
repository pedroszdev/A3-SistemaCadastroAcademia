import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { aparar } from '../../common/utils/aparar';

// Só confere o formato do corpo: credencial fora das regras de cadastro cai no
// 401 genérico do login, não num 400 que revela essas regras (RN12).
export class LoginDto {
  @Transform(aparar)
  @IsString({ message: 'login deve ser um texto' })
  @IsNotEmpty({ message: 'login é obrigatório' })
  login!: string;

  @IsString({ message: 'senha deve ser um texto' })
  @IsNotEmpty({ message: 'senha é obrigatória' })
  senha!: string;
}
