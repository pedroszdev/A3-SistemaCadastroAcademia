import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let config: { getOrThrow: jest.Mock };
  let service: PrismaService;

  beforeEach(() => {
    config = {
      getOrThrow: jest
        .fn()
        .mockReturnValue('postgresql://teste:teste@localhost:5432/teste'),
    };
    service = new PrismaService(config as unknown as ConfigService);
  });

  it('lê a DATABASE_URL da configuração', () => {
    expect(config.getOrThrow).toHaveBeenCalledWith('DATABASE_URL');
  });

  it('conecta ao iniciar o módulo', async () => {
    const connect = jest
      .spyOn(service, '$connect')
      .mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('desconecta ao destruir o módulo', async () => {
    const disconnect = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
