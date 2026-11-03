import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import type { Request } from 'express';

// Sem este guard, um corpo que não é JSON não é lido e vira `{}` no ValidationPipe:
// os padrões do DTO entram no lugar do que o cliente enviou, e a resposta ainda é 2xx.
@Injectable()
export class ExigeJsonGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    // `req.is` trata `Content-Length: 0` como corpo, mas clientes o enviam em PATCH vazio.
    const corpoVazio = request.headers['content-length'] === '0';

    if (!corpoVazio && request.is('application/json') === false) {
      throw new UnsupportedMediaTypeException(
        'O corpo da requisição deve ser JSON',
      );
    }
    return true;
  }
}
