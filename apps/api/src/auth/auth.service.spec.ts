import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrismaService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockPrismaService = {
      client: {
        user: {
          findFirst: jest.fn(),
          create: jest.fn(),
        },
      },
    };

    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return null when authorization header is missing', async () => {
    const result = await service.validateRequest({ headers: {} });
    expect(result).toBeNull();
  });

  it('should return null when token is missing after Bearer prefix', async () => {
    const result = await service.validateRequest({
      headers: { authorization: 'Bearer ' },
    });
    expect(result).toBeNull();
  });

  it('should return user and session when token verification succeeds', async () => {
    const mockDecodedToken = {
      uid: 'firebase-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      email_verified: true,
      role: 'user',
    };

    service.adminAuth = {
      verifyIdToken: jest.fn().mockResolvedValue(mockDecodedToken),
    } as any;

    mockPrismaService.client.user.findFirst.mockResolvedValue({
      id: 'db-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    });

    const result = await service.validateRequest({
      headers: { authorization: 'Bearer valid-firebase-token' },
    });

    expect(result).not.toBeNull();
    expect(result?.user.id).toBe('db-user-id');
    expect(result?.user.email).toBe('test@example.com');
    expect(result?.session.uid).toBe('firebase-uid-123');
  });

  it('should return null when verifyIdToken throws an error', async () => {
    service.adminAuth = {
      verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid token')),
    } as any;

    const result = await service.validateRequest({
      headers: { authorization: 'Bearer expired-token' },
    });

    expect(result).toBeNull();
  });
});
