import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockHealthService = {
    check: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        status: 'ok',
        info: { database: { status: 'up' }, redis: { status: 'up' }, storage: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' }, redis: { status: 'up' }, storage: { status: 'up' } },
      });
    }),
  };

  const mockPrismaService = {
    client: {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ 1: 1 }]),
    },
  };

  const mockRedisService = {
    ping: jest.fn().mockResolvedValue(true),
  };

  const mockStorageService = {
    checkHealth: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status ok with db connected', async () => {
    const response = await controller.getHealth();
    expect(response.success).toBe(true);
    expect((response.data as any)?.status).toBe('ok');
    expect(response.meta?.timestamp).toBeDefined();
  });
});
