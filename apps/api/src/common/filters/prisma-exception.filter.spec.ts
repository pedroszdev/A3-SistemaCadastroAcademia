import { ArgumentsHost, HttpServer, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

function erroPrisma(code: string) {
  return new PrismaClientKnownRequestError('erro do prisma', {
    code,
    clientVersion: 'test',
  });
}

describe('PrismaExceptionFilter', () => {
  const response = {};
  const host = {
    getArgByIndex: jest.fn().mockReturnValue(response),
  } as unknown as ArgumentsHost;
  let httpAdapter: jest.Mocked<
    Pick<HttpServer, 'reply' | 'isHeadersSent' | 'end'>
  >;
  let filter: PrismaExceptionFilter;

  beforeEach(() => {
    httpAdapter = {
      reply: jest.fn(),
      isHeadersSent: jest.fn().mockReturnValue(false),
      end: jest.fn(),
    };
    filter = new PrismaExceptionFilter(httpAdapter as unknown as HttpServer);
  });

  it.each([
    ['P2002', 409, 'Conflict', 'Já existe um registro com esses dados.'],
    ['P2025', 404, 'Not Found', 'Registro não encontrado.'],
    [
      'P2003',
      409,
      'Conflict',
      'A operação viola um relacionamento com outro registro.',
    ],
  ])('%s → %i', (code, statusCode, error, message) => {
    filter.catch(erroPrisma(code), host);

    expect(httpAdapter.reply).toHaveBeenCalledWith(
      response,
      { statusCode, error, message },
      statusCode,
    );
  });

  it('responde 500 para códigos não mapeados', () => {
    const logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    filter.catch(erroPrisma('P2034'), host);

    expect(httpAdapter.reply).toHaveBeenCalledWith(
      response,
      { statusCode: 500, message: 'Internal server error' },
      500,
    );
    logError.mockRestore();
  });
});
