import { Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  INTERVALO_ROTINA_MS,
  MensalidadesService,
} from './mensalidades.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const dia = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const HOJE = dia('2026-11-24');

const comPlano = (extra: Record<string, unknown> = {}) => ({
  id: ID,
  valorMensalidade: new Prisma.Decimal(120),
  diaVencimento: 10,
  ...extra,
});

describe('MensalidadesService (RN18)', () => {
  let prisma: {
    membro: { findMany: jest.Mock };
    pagamento: { findFirst: jest.Mock; createMany: jest.Mock };
  };
  let service: MensalidadesService;

  beforeEach(() => {
    prisma = {
      membro: { findMany: jest.fn() },
      pagamento: {
        findFirst: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new MensalidadesService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('garantirProxima', () => {
    it('cria a cobrança do próximo vencimento com o valor do plano', async () => {
      await expect(service.garantirProxima(comPlano(), HOJE)).resolves.toBe(
        true,
      );

      expect(prisma.pagamento.findFirst).toHaveBeenCalledWith({
        where: {
          membroId: ID,
          dataVencimento: { gte: dia('2026-12-01'), lt: dia('2027-01-01') },
        },
        select: { id: true },
      });
      expect(prisma.pagamento.createMany).toHaveBeenCalledWith({
        data: [
          {
            membroId: ID,
            valor: new Prisma.Decimal(120),
            dataVencimento: dia('2026-12-10'),
          },
        ],
        skipDuplicates: true,
      });
    });

    it('não cria se já há cobrança no mês do vencimento, mesmo cancelada', async () => {
      prisma.pagamento.findFirst.mockResolvedValue({ id: 'p1' });

      await expect(service.garantirProxima(comPlano(), HOJE)).resolves.toBe(
        false,
      );
      expect(prisma.pagamento.createMany).not.toHaveBeenCalled();
    });

    it.each([
      ['sem valor', { valorMensalidade: null }],
      ['sem dia', { diaVencimento: null }],
    ])('não faz nada para o membro %s', async (_, extra) => {
      await expect(
        service.garantirProxima(comPlano(extra), HOJE),
      ).resolves.toBe(false);
      expect(prisma.pagamento.findFirst).not.toHaveBeenCalled();
    });

    it('devolve false quando o índice único segura uma corrida', async () => {
      prisma.pagamento.createMany.mockResolvedValue({ count: 0 });

      await expect(service.garantirProxima(comPlano(), HOJE)).resolves.toBe(
        false,
      );
    });

    it('usa o cliente recebido (a transação do cadastro)', async () => {
      const tx = {
        pagamento: {
          findFirst: jest.fn().mockResolvedValue(null),
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      await service.garantirProxima(
        comPlano(),
        HOJE,
        tx as unknown as Parameters<MensalidadesService['garantirProxima']>[2],
      );

      expect(tx.pagamento.createMany).toHaveBeenCalled();
      expect(prisma.pagamento.createMany).not.toHaveBeenCalled();
    });
  });

  describe('gerarPendentes', () => {
    it('passa pelos ativos com plano e conta as criadas', async () => {
      prisma.membro.findMany.mockResolvedValue([
        comPlano(),
        comPlano({ id: 'outro' }),
      ]);
      prisma.pagamento.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'ja-existe' });

      await expect(service.gerarPendentes(HOJE)).resolves.toBe(1);
      expect(prisma.membro.findMany).toHaveBeenCalledWith({
        where: {
          ativo: true,
          valorMensalidade: { not: null },
          diaVencimento: { not: null },
        },
        select: { id: true, valorMensalidade: true, diaVencimento: true },
      });
    });
  });

  describe('rotina', () => {
    it('roda ao subir e de hora em hora', () => {
      jest.useFakeTimers();
      const rodar = jest
        .spyOn(service, 'rodarRotina')
        .mockResolvedValue(undefined);

      service.onApplicationBootstrap();
      expect(rodar).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(INTERVALO_ROTINA_MS);
      expect(rodar).toHaveBeenCalledTimes(2);

      service.onModuleDestroy();
      jest.advanceTimersByTime(INTERVALO_ROTINA_MS);
      expect(rodar).toHaveBeenCalledTimes(2);
    });

    it('registra quantas gerou', async () => {
      const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      jest.spyOn(service, 'gerarPendentes').mockResolvedValue(2);

      await service.rodarRotina();

      expect(log).toHaveBeenCalledWith('2 mensalidade(s) gerada(s)');
    });

    it('fica quieta quando não há o que gerar', async () => {
      const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      jest.spyOn(service, 'gerarPendentes').mockResolvedValue(0);

      await service.rodarRotina();

      expect(log).not.toHaveBeenCalled();
    });

    it('um erro não derruba a API: só registra', async () => {
      const erro = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      jest.spyOn(service, 'gerarPendentes').mockRejectedValue(new Error('x'));

      await expect(service.rodarRotina()).resolves.toBeUndefined();
      expect(erro).toHaveBeenCalled();
    });
  });
});
