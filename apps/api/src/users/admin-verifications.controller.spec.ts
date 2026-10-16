import { Test, TestingModule } from '@nestjs/testing';
import { AdminVerificationsController } from './admin-verifications.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

describe('AdminVerificationsController', () => {
  let controller: AdminVerificationsController;
  let service: UsersService;

  const mockUsersService = {
    adminApproveVerification: jest.fn(),
    adminRejectVerification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminVerificationsController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminVerificationsController>(AdminVerificationsController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('approveVerification', () => {
    it('should call adminApproveVerification on service', async () => {
      const mockResult = {
        id: 'vr_1',
        userId: 'u1',
        category: 'CREATOR',
        legalName: 'Jane Doe',
        documentType: 'PASSPORT',
        documentUrl: 'https://cdn.example.com/doc.jpg',
        status: 'APPROVED',
        createdAt: '2026-10-06T12:00:00Z',
      };
      mockUsersService.adminApproveVerification.mockResolvedValue(mockResult);

      const res = await controller.approveVerification('vr_1', { id: 'admin_1' });
      expect(res).toEqual(mockResult);
      expect(mockUsersService.adminApproveVerification).toHaveBeenCalledWith('vr_1', 'admin_1');
    });
  });

  describe('rejectVerification', () => {
    it('should call adminRejectVerification on service', async () => {
      const mockResult = {
        id: 'vr_1',
        userId: 'u1',
        category: 'CREATOR',
        legalName: 'Jane Doe',
        documentType: 'PASSPORT',
        documentUrl: 'https://cdn.example.com/doc.jpg',
        status: 'REJECTED',
        rejectionReason: 'Invalid document',
        createdAt: '2026-10-06T12:00:00Z',
      };
      mockUsersService.adminRejectVerification.mockResolvedValue(mockResult);

      const res = await controller.rejectVerification('vr_1', { id: 'admin_1' }, {
        reason: 'Invalid document',
      });
      expect(res).toEqual(mockResult);
      expect(mockUsersService.adminRejectVerification).toHaveBeenCalledWith('vr_1', 'admin_1', {
        reason: 'Invalid document',
      });
    });
  });
});
