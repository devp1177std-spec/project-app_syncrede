import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

describe('StorageService', () => {
  let service: StorageService;

  const mockConfigService = {
    get: jest.fn((key: string, fallback?: any) => {
      const config: Record<string, any> = {
        STORAGE_ENDPOINT: 'http://localhost:9000',
        STORAGE_REGION: 'us-east-1',
        STORAGE_ACCESS_KEY_ID: 'minioadmin',
        STORAGE_SECRET_ACCESS_KEY: 'minioadminpassword',
        STORAGE_BUCKET_NAME: 'social-media-assets',
        STORAGE_PUBLIC_URL: 'http://localhost:9000/social-media-assets',
        STORAGE_FORCE_PATH_STYLE: true,
      };
      return config[key] ?? fallback;
    }),
  };

  beforeEach(() => {
    service = new StorageService(mockConfigService as any as ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should expose the configured bucket name', () => {
    expect(service.getBucketName()).toBe('social-media-assets');
  });

  it('should return an S3Client instance', () => {
    expect(service.getClient()).toBeInstanceOf(S3Client);
  });

  it('should generate a unique file key with prefix and sanitised name', () => {
    const key = service.generateFileKey('My Photo.jpg', 'avatars');
    expect(key).toMatch(/^avatars\/\d+-[a-f0-9]+-My_Photo\.jpg$/);
  });
});
