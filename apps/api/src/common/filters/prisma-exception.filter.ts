import {
  ArgumentsHost,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

// Rede de segurança: os services continuam validando com mensagens de domínio
// (ex.: "CPF já cadastrado"). Códigos não mapeados seguem como 500.
const ERROS_PRISMA: Record<string, () => HttpException> = {
  P2002: () => new ConflictException('Já existe um registro com esses dados.'),
  P2025: () => new NotFoundException('Registro não encontrado.'),
  P2003: () =>
    new ConflictException(
      'A operação viola um relacionamento com outro registro.',
    ),
};

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const criarExcecao = ERROS_PRISMA[exception.code];
    super.catch(criarExcecao ? criarExcecao() : exception, host);
  }
}
