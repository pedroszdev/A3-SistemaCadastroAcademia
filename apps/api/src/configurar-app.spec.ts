import {
  ArgumentMetadata,
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { LoginDto } from './auth/dto/login.dto';
import { configurarApp } from './configurar-app';

const metadata: ArgumentMetadata = { type: 'body', metatype: LoginDto };

function montar() {
  const app = {
    enableCors: jest.fn(),
    useGlobalPipes: jest.fn<void, [ValidationPipe]>(),
  };
  configurarApp(app as unknown as INestApplication);
  return app;
}

describe('configurarApp', () => {
  it('habilita o CORS', () => {
    const app = montar();

    expect(app.enableCors).toHaveBeenCalledTimes(1);
  });

  it('registra o ValidationPipe global', () => {
    const app = montar();

    expect(app.useGlobalPipes).toHaveBeenCalledTimes(1);
    expect(app.useGlobalPipes.mock.calls[0][0]).toBeInstanceOf(ValidationPipe);
  });

  it('o pipe rejeita campo fora do DTO (forbidNonWhitelisted)', async () => {
    const pipe = montar().useGlobalPipes.mock.calls[0][0];

    await expect(
      pipe.transform({ login: 'a', senha: 'b', extra: 1 }, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('o pipe transforma o corpo em instância do DTO (transform)', async () => {
    const pipe = montar().useGlobalPipes.mock.calls[0][0];

    const corpo: unknown = await pipe.transform(
      { login: ' a ', senha: 'b' },
      metadata,
    );

    expect(corpo).toBeInstanceOf(LoginDto);
    expect(corpo).toEqual({ login: 'a', senha: 'b' });
  });
});
