import { hash } from 'bcryptjs';

// RN12: todo senhaHash, de funcionário e de aluno, usa este custo. O login
// compara com um hash fictício do mesmo custo, para o tempo de resposta não
// revelar se a conta existe (auth.service.ts).
export const SALT_ROUNDS = 10;

export function hashSenha(senha: string): Promise<string> {
  return hash(senha, SALT_ROUNDS);
}
