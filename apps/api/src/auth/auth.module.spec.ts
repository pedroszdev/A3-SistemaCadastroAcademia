import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from './auth.module';

describe('AuthModule', () => {
  let moduleRef: TestingModule | undefined;

  // Monta o módulo só com a configuração informada, sem ler .env nem o
  // ambiente do processo, e sem abrir conexão com o banco.
  const montar = (
    expira?: string,
    segredo = 'segredo-apenas-para-teste-com-32-caracteres',
  ) =>
    Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          skipProcessEnv: true,
          load: [
            () => ({
              JWT_SECRET: segredo,
              ...(expira !== undefined && { JWT_EXPIRES_IN: expira }),
            }),
          ],
        }),
        PrismaModule,
        AuthModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

  const duracaoDoToken = (modulo: TestingModule): number => {
    const jwt = modulo.get(JwtService);
    const decodificado = jwt.decode<{ exp: number; iat: number }>(
      jwt.sign({ sub: 'x' }),
    );
    return decodificado.exp - decodificado.iat;
  };

  afterEach(async () => {
    await moduleRef?.close();
    moduleRef = undefined;
  });

  describe('JWT_EXPIRES_IN válido', () => {
    it.each([
      ['28800', 28800],
      ['8h', 28800],
      ['30m', 1800],
      ['7d', 604800],
      ['45s', 45],
    ])('%s → token de %i segundos', async (valor, segundos) => {
      moduleRef = await montar(valor);

      expect(duracaoDoToken(moduleRef)).toBe(segundos);
    });

    it('ausente → usa o padrão de 8h', async () => {
      moduleRef = await montar();

      expect(duracaoDoToken(moduleRef)).toBe(28800);
    });
  });

  describe('JWT_EXPIRES_IN inválido', () => {
    it.each(['', '8 horas', '0', '-5', '8x'])(
      '"%s" → a API não sobe',
      async (valor) => {
        await expect(montar(valor)).rejects.toThrow(/JWT_EXPIRES_IN inválido/);
      },
    );
  });

  describe('JWT_SECRET', () => {
    it('com 32 caracteres → a API sobe', async () => {
      moduleRef = await montar(undefined, 'a'.repeat(32));

      expect(duracaoDoToken(moduleRef)).toBe(28800);
    });

    it.each([['a'], ['a'.repeat(31)]])(
      '"%s" → a API não sobe',
      async (segredo) => {
        await expect(montar(undefined, segredo)).rejects.toThrow(
          /JWT_SECRET muito curto/,
        );
      },
    );
  });
});
