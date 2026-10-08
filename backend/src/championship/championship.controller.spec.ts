import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import * as request from 'supertest';
import { ChampionshipController } from './championship.controller';
import { ChampionshipService } from './championship.service';
import { ChampionshipEntity } from './championship.entity';
import { ChampionshipOwnerGuard } from '../membership/guards/championship-owner.guard';
import { MembershipEntity } from '../membership/membership.entity';

describe('Championship prize-fund HTTP API', () => {
  let app: INestApplication;
  const config = {
    entryFeeMinorUnits: '10000',
    prizeFundRule: {
      tieMode: 'tie_breakers',
      prizeAmountsMinorUnits: ['150000', '100000', '50000', '0'],
    },
  };
  const service = {
    getPrizeFund: jest.fn().mockResolvedValue(config),
    updatePrizeFund: jest.fn().mockImplementation(async (_id, dto) => dto),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ChampionshipController],
      providers: [
        { provide: ChampionshipService, useValue: service },
        ChampionshipOwnerGuard,
        {
          provide: getRepositoryToken(ChampionshipEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue({ createdByUserId: '1' }),
          },
        },
        { provide: getRepositoryToken(MembershipEntity), useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    app.use(
      (
        req: Request & { user?: { id: number; role: string } },
        _res: Response,
        next: NextFunction,
      ) => {
        const role = req.header('x-test-role');
        if (role)
          req.user = { id: Number(req.header('x-test-user') ?? 2), role };
        next();
      },
    );
    await app.init();
  });
  afterAll(async () => app.close());

  it('allows authenticated regular users to read configuration', async () => {
    const response = await request(app.getHttpServer())
      .get('/championships/champ-1/prize-fund')
      .set('x-test-role', 'user');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(config);
  });

  it('rejects unauthenticated reads and writes', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(
        (
          await request(app.getHttpServer()).get(
            '/championships/champ-1/prize-fund',
          )
        ).status,
      ).toBe(401);
      expect(
        (
          await request(app.getHttpServer())
            .put('/championships/champ-1/prize-fund')
            .send(config)
        ).status,
      ).toBe(401);
    } finally {
      warning.mockRestore();
    }
  });

  it('rejects writes by regular non-owner users', async () => {
    expect(
      (
        await request(app.getHttpServer())
          .put('/championships/champ-1/prize-fund')
          .set('x-test-role', 'user')
          .send(config)
      ).status,
    ).toBe(403);
  });

  it.each([
    ['user', '1'],
    ['admin', '2'],
    ['super_admin', '2'],
  ])('allows %s/%s to save', async (role, id) => {
    const response = await request(app.getHttpServer())
      .put('/championships/champ-1/prize-fund')
      .set('x-test-role', role)
      .set('x-test-user', id)
      .send(config);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(config);
  });

  it.each([
    { ...config, entryFeeMinorUnits: '-1' },
    { ...config, entryFeeMinorUnits: 10000 },
    {
      ...config,
      prizeFundRule: {
        tieMode: 'unknown',
        prizeAmountsMinorUnits: ['0', '0', '0'],
      },
    },
    {
      ...config,
      prizeFundRule: { tieMode: 'tie_breakers', prizeAmountsMinorUnits: [] },
    },
    {
      ...config,
      prizeFundRule: {
        tieMode: 'tie_breakers',
        prizeAmountsMinorUnits: ['0', '0', '0'],
        amount: 10,
      },
    },
    { ...config, prizeFundRule: null },
    { ...config, totalFund: '100' },
  ])('rejects invalid or extra configuration fields: %p', async (payload) => {
    expect(
      (
        await request(app.getHttpServer())
          .put('/championships/champ-1/prize-fund')
          .set('x-test-role', 'admin')
          .send(payload)
      ).status,
    ).toBe(400);
  });
});
