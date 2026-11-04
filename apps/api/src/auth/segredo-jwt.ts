import { ConfigService } from '@nestjs/config';

// Com HS256, um segredo curto pode ser descoberto por força bruta a partir de
// qualquer token emitido, e aí qualquer um forja um token de ADMIN. Por isso o
// segredo curto impede a API de subir, como o JWT_EXPIRES_IN inválido.
export const TAMANHO_MINIMO_SEGREDO = 32;

export function segredoJwt(config: ConfigService): string {
  const segredo = config.getOrThrow<string>('JWT_SECRET');
  if (segredo.length < TAMANHO_MINIMO_SEGREDO) {
    throw new Error(
      `JWT_SECRET muito curto: use pelo menos ${TAMANHO_MINIMO_SEGREDO} caracteres. Gere um com: openssl rand -hex 32`,
    );
  }
  return segredo;
}
