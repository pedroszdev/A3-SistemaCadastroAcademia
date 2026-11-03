import { ValidateIf } from 'class-validator';

// Só pula a validação quando o campo não veio. O @IsOptional também deixa
// passar null, que o Prisma recusa nas colunas obrigatórias (vira 500).
export function SeVeio() {
  return ValidateIf((_, valor: unknown) => valor !== undefined);
}
