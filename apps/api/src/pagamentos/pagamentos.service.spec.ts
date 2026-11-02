import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { StatusPagamento } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { PAGAMENTO_SELECT, PagamentosService } from './pagamentos.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const MEMBRO_ID = '0199f0a2-7b3c-7d4e-8f00-123456789def';

const pagamento = (extra: Record<string, unknown> = {}) => ({
  id: ID,
  membroId: MEMBRO_ID,
  valor: new Prisma.Decimal('99.90'),
  dataVencimento: new Date('2026-10-20'),
  dataPagamento: null,
  status: StatusPagamento.PENDENTE,
  membro: { id: MEMBRO_ID, nome: 'João Pereira' },
  ...extra,
});

function primeiroArg<T>(mock: jest.Mock): T {
  const [[arg]] = mock.mock.calls as [[T]];
  return arg;
}

describe('PagamentosService', () => {
  let prisma: {
    pagamento: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      aggregate: jest.Mock;
    };
    membro: { findUnique: jest.Mock };
  };
  let service: PagamentosService;

  beforeEach(() => {
    // hoje = 2026-10-10 em São Paulo
    jest.useFakeTimers().setSystemTime(new Date('2026-10-10T15:00:00Z'));
    prisma = {
      pagamento: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        aggregate: jest.fn(),
      },
      membro: { findUnique: jest.fn() },
    };
    service = new PagamentosService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    const dto = {
      membroId: MEMBRO_ID,
      valor: 99.9,
      dataVencimento: new Date('2026-10-20'),
    };

    it('checa o membro antes de gravar e devolve o pagamento apresentado', async () => {
      prisma.membro.findUnique.mockResolvedValue({ ativo: true });
      prisma.pagamento.create.mockResolvedValue(pagamento());

      const criado = await service.create(dto);

      expect(prisma.membro.findUnique).toHaveBeenCalledWith({
        where: { id: MEMBRO_ID },
        select: { ativo: true },
      });
      expect(prisma.membro.findUnique.mock.invocationCallOrder[0]).toBeLessThan(
        prisma.pagamento.create.mock.invocationCallOrder[0],
      );
      expect(prisma.pagamento.create).toHaveBeenCalledWith({
        data: {
          membroId: MEMBRO_ID,
          valor: 99.9,
          dataVencimento: dto.dataVencimento,
        },
        select: PAGAMENTO_SELECT,
      });
      expect(criado.valor).toBe(99.9);
      expect(criado.status).toBe('PENDENTE');
      expect(criado.diasEmAtraso).toBe(0);
    });

    it('lança 404 quando o membro não existe, sem gravar', async () => {
      prisma.membro.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(
        new NotFoundException('Membro não encontrado'),
      );
      expect(prisma.pagamento.create).not.toHaveBeenCalled();
    });

    it('lança 422 quando o membro está inativo (RN04), sem gravar', async () => {
      prisma.membro.findUnique.mockResolvedValue({ ativo: false });

      await expect(service.create(dto)).rejects.toThrow(
        new UnprocessableEntityException(
          'Membro inativo não pode receber novo pagamento',
        ),
      );
      expect(prisma.pagamento.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const base = { page: 1, pageSize: 20 };
    const hojeSP = new Date('2026-10-10');

    beforeEach(() => {
      prisma.pagamento.findMany.mockResolvedValue([]);
      prisma.pagamento.count.mockResolvedValue(0);
    });

    it('sem filtros não restringe a consulta', async () => {
      await service.findAll(base);

      const where = {
        membroId: undefined,
        AND: [{ dataVencimento: { gte: undefined, lte: undefined } }, {}],
      };
      expect(prisma.pagamento.findMany).toHaveBeenCalledWith({
        where,
        select: PAGAMENTO_SELECT,
        // id desempata vencimentos iguais, para a paginação não repetir nem pular
        orderBy: [{ dataVencimento: 'desc' }, { id: 'asc' }],
        skip: 0,
        take: 20,
      });
      expect(prisma.pagamento.count).toHaveBeenCalledWith({ where });
    });

    it('filtra por membro e período de vencimento', async () => {
      const vencimentoDe = new Date('2026-10-01');
      const vencimentoAte = new Date('2026-10-31');

      await service.findAll({
        ...base,
        membroId: MEMBRO_ID,
        vencimentoDe,
        vencimentoAte,
      });

      const where = {
        membroId: MEMBRO_ID,
        AND: [
          { dataVencimento: { gte: vencimentoDe, lte: vencimentoAte } },
          {},
        ],
      };
      expect(primeiroArg(prisma.pagamento.findMany)).toMatchObject({ where });
      expect(prisma.pagamento.count).toHaveBeenCalledWith({ where });
    });

    it.each([
      [
        'ATRASADO',
        {
          status: StatusPagamento.PENDENTE,
          dataPagamento: null,
          dataVencimento: { lt: hojeSP },
        },
      ],
      [
        'PENDENTE',
        {
          status: StatusPagamento.PENDENTE,
          dataPagamento: null,
          dataVencimento: { gte: hojeSP },
        },
      ],
      ['PAGO', { status: StatusPagamento.PAGO }],
      ['CANCELADO', { status: StatusPagamento.CANCELADO }],
    ] as const)(
      'traduz o status %s para a consulta',
      async (status, filtro) => {
        await service.findAll({ ...base, status });

        const where = {
          membroId: undefined,
          AND: [{ dataVencimento: { gte: undefined, lte: undefined } }, filtro],
        };
        expect(primeiroArg(prisma.pagamento.findMany)).toMatchObject({ where });
        expect(prisma.pagamento.count).toHaveBeenCalledWith({ where });
      },
    );

    it('devolve o status calculado, os dias em atraso e a paginação', async () => {
      prisma.pagamento.findMany.mockResolvedValue([
        pagamento({ dataVencimento: new Date('2026-10-03') }),
        pagamento({ id: 'outro', dataVencimento: new Date('2026-10-20') }),
      ]);
      prisma.pagamento.count.mockResolvedValue(41);

      const resultado = await service.findAll({
        page: 2,
        pageSize: 2,
      });

      expect(prisma.pagamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 2, take: 2 }),
      );
      expect(resultado).toEqual({
        data: [
          expect.objectContaining({
            id: ID,
            valor: 99.9,
            status: 'ATRASADO',
            diasEmAtraso: 7,
          }),
          expect.objectContaining({
            id: 'outro',
            valor: 99.9,
            status: 'PENDENTE',
            diasEmAtraso: 0,
          }),
        ],
        total: 41,
        page: 2,
        pageSize: 2,
      });
    });
  });

  describe('findOne', () => {
    it('devolve o pagamento apresentado', async () => {
      prisma.pagamento.findUnique.mockResolvedValue(
        pagamento({ dataVencimento: new Date('2026-10-05') }),
      );

      const encontrado = await service.findOne(ID);

      expect(prisma.pagamento.findUnique).toHaveBeenCalledWith({
        where: { id: ID },
        select: PAGAMENTO_SELECT,
      });
      expect(encontrado).toMatchObject({
        id: ID,
        valor: 99.9,
        status: 'ATRASADO',
        diasEmAtraso: 5,
      });
    });

    it('lança 404 quando o pagamento não existe', async () => {
      prisma.pagamento.findUnique.mockResolvedValue(null);

      await expect(service.findOne(ID)).rejects.toThrow(
        new NotFoundException('Pagamento não encontrado'),
      );
    });
  });

  describe('registrarPagamento', () => {
    const dto = {
      dataPagamento: new Date('2026-10-10'),
    };

    it('marca como PAGO só se ainda está PENDENTE e devolve o pagamento apresentado', async () => {
      prisma.pagamento.updateMany.mockResolvedValue({ count: 1 });
      prisma.pagamento.findUnique.mockResolvedValue(
        pagamento({
          status: StatusPagamento.PAGO,
          dataPagamento: dto.dataPagamento,
          dataVencimento: new Date('2026-10-05'),
        }),
      );

      const pago = await service.registrarPagamento(ID, dto);

      expect(prisma.pagamento.updateMany).toHaveBeenCalledWith({
        where: { id: ID, status: StatusPagamento.PENDENTE },
        data: {
          status: StatusPagamento.PAGO,
          dataPagamento: dto.dataPagamento,
        },
      });
      expect(prisma.pagamento.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.pagamento.findUnique).toHaveBeenCalledWith({
        where: { id: ID },
        select: PAGAMENTO_SELECT,
      });
      expect(pago).toMatchObject({
        id: ID,
        valor: 99.9,
        status: 'PAGO',
        diasEmAtraso: 0,
      });
    });

    it.each([
      ['já pago', StatusPagamento.PAGO, 'Pagamento já foi pago'],
      [
        'cancelado',
        StatusPagamento.CANCELADO,
        'Pagamento cancelado não pode ser pago',
      ],
    ])(
      'lança 409 quando o pagamento está %s',
      async (_caso, status, mensagem) => {
        prisma.pagamento.updateMany.mockResolvedValue({ count: 0 });
        prisma.pagamento.findUnique.mockResolvedValue({ status });

        await expect(service.registrarPagamento(ID, dto)).rejects.toThrow(
          new ConflictException(mensagem),
        );
        expect(prisma.pagamento.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.pagamento.findUnique).toHaveBeenCalledWith({
          where: { id: ID },
          select: { status: true },
        });
      },
    );

    it('lança 404 quando o pagamento não existe', async () => {
      prisma.pagamento.updateMany.mockResolvedValue({ count: 0 });
      prisma.pagamento.findUnique.mockResolvedValue(null);

      await expect(service.registrarPagamento(ID, dto)).rejects.toThrow(
        new NotFoundException('Pagamento não encontrado'),
      );
      expect(prisma.pagamento.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.pagamento.findUnique).toHaveBeenCalledWith({
        where: { id: ID },
        select: { status: true },
      });
    });
  });

  describe('cancelar', () => {
    it('marca como CANCELADO só se ainda está PENDENTE e devolve o pagamento apresentado', async () => {
      prisma.pagamento.updateMany.mockResolvedValue({ count: 1 });
      prisma.pagamento.findUnique.mockResolvedValue(
        pagamento({
          status: StatusPagamento.CANCELADO,
          dataVencimento: new Date('2026-10-05'),
        }),
      );

      const cancelado = await service.cancelar(ID);

      expect(prisma.pagamento.updateMany).toHaveBeenCalledWith({
        where: { id: ID, status: StatusPagamento.PENDENTE },
        data: { status: StatusPagamento.CANCELADO },
      });
      expect(prisma.pagamento.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.pagamento.findUnique).toHaveBeenCalledWith({
        where: { id: ID },
        select: PAGAMENTO_SELECT,
      });
      expect(cancelado).toMatchObject({
        id: ID,
        valor: 99.9,
        status: 'CANCELADO',
        diasEmAtraso: 0,
      });
    });

    it.each([
      [
        'já pago',
        StatusPagamento.PAGO,
        'Pagamento já pago não pode ser cancelado',
      ],
      [
        'já cancelado',
        StatusPagamento.CANCELADO,
        'Pagamento já está cancelado',
      ],
    ])(
      'lança 409 quando o pagamento está %s',
      async (_caso, status, mensagem) => {
        prisma.pagamento.updateMany.mockResolvedValue({ count: 0 });
        prisma.pagamento.findUnique.mockResolvedValue({ status });

        await expect(service.cancelar(ID)).rejects.toThrow(
          new ConflictException(mensagem),
        );
        expect(prisma.pagamento.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.pagamento.findUnique).toHaveBeenCalledWith({
          where: { id: ID },
          select: { status: true },
        });
      },
    );

    it('lança 404 quando o pagamento não existe', async () => {
      prisma.pagamento.updateMany.mockResolvedValue({ count: 0 });
      prisma.pagamento.findUnique.mockResolvedValue(null);

      await expect(service.cancelar(ID)).rejects.toThrow(
        new NotFoundException('Pagamento não encontrado'),
      );
      expect(prisma.pagamento.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.pagamento.findUnique).toHaveBeenCalledWith({
        where: { id: ID },
        select: { status: true },
      });
    });
  });

  describe('situacaoMembro', () => {
    const agregado = (
      quantidade: number,
      vencimentoMaisAntigo: string | null,
    ) => ({
      _count: { _all: quantidade },
      _min: {
        dataVencimento: vencimentoMaisAntigo
          ? new Date(vencimentoMaisAntigo)
          : null,
      },
    });

    beforeEach(() => {
      prisma.membro.findUnique.mockResolvedValue({ id: MEMBRO_ID });
    });

    it('sem atrasos está EM_DIA e agrega só os pagamentos atrasados do membro', async () => {
      prisma.pagamento.aggregate.mockResolvedValue(agregado(0, null));

      const situacao = await service.situacaoMembro(MEMBRO_ID);

      expect(prisma.membro.findUnique).toHaveBeenCalledWith({
        where: { id: MEMBRO_ID },
        select: { id: true },
      });
      expect(prisma.pagamento.aggregate).toHaveBeenCalledWith({
        where: {
          membroId: MEMBRO_ID,
          status: StatusPagamento.PENDENTE,
          dataPagamento: null,
          dataVencimento: { lt: new Date('2026-10-10') },
        },
        _count: { _all: true },
        _min: { dataVencimento: true },
      });
      expect(situacao).toEqual({
        situacao: 'EM_DIA',
        pagamentosAtrasados: 0,
        maiorAtrasoDias: 0,
      });
    });

    it.each([
      ['5 dias', '2026-10-05', 'EM_DIA', 5],
      ['10 dias (limite da tolerância)', '2026-09-30', 'EM_DIA', 10],
      ['11 dias', '2026-09-29', 'INADIMPLENTE', 11],
    ] as const)(
      'com atraso de %s fica %s',
      async (_caso, vencimento, situacao, dias) => {
        prisma.pagamento.aggregate.mockResolvedValue(agregado(1, vencimento));

        await expect(service.situacaoMembro(MEMBRO_ID)).resolves.toEqual({
          situacao,
          pagamentosAtrasados: 1,
          maiorAtrasoDias: dias,
        });
      },
    );

    it('com vários atrasados conta todos e usa o vencimento mais antigo', async () => {
      prisma.pagamento.aggregate.mockResolvedValue(agregado(3, '2026-09-20'));

      await expect(service.situacaoMembro(MEMBRO_ID)).resolves.toEqual({
        situacao: 'INADIMPLENTE',
        pagamentosAtrasados: 3,
        maiorAtrasoDias: 20,
      });
    });

    it('lança 404 quando o membro não existe, sem consultar pagamentos', async () => {
      prisma.membro.findUnique.mockResolvedValue(null);

      await expect(service.situacaoMembro(MEMBRO_ID)).rejects.toThrow(
        new NotFoundException('Membro não encontrado'),
      );
      expect(prisma.pagamento.aggregate).not.toHaveBeenCalled();
    });
  });

  describe('assertMembroAdimplente', () => {
    beforeEach(() => {
      prisma.membro.findUnique.mockResolvedValue({ id: MEMBRO_ID });
    });

    it('resolve quando o membro está EM_DIA', async () => {
      prisma.pagamento.aggregate.mockResolvedValue({
        _count: { _all: 1 },
        _min: { dataVencimento: new Date('2026-10-05') },
      });

      await expect(
        service.assertMembroAdimplente(MEMBRO_ID),
      ).resolves.toBeUndefined();
    });

    it('lança 422 quando o membro está INADIMPLENTE (RN09)', async () => {
      prisma.pagamento.aggregate.mockResolvedValue({
        _count: { _all: 1 },
        _min: { dataVencimento: new Date('2026-09-29') },
      });

      await expect(service.assertMembroAdimplente(MEMBRO_ID)).rejects.toThrow(
        new UnprocessableEntityException('Membro com pagamento em atraso'),
      );
    });

    it('repassa o 404 quando o membro não existe', async () => {
      prisma.membro.findUnique.mockResolvedValue(null);

      await expect(service.assertMembroAdimplente(MEMBRO_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
