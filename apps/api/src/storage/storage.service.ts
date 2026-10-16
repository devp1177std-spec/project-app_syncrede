import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PresignedUrlResponse } from '@social/types';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicBaseUrl?: string;

  constructor(private readonly configService: ConfigService) {
    const r2AccountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const endpoint =
      this.configService.get<string>('STORAGE_ENDPOINT') ||
      (r2AccountId ? 'https://' + r2AccountId + '.r2.cloudflarestorage.com' : undefined);

    const region = this.configService.get<string>('STORAGE_REGION', 'auto');
    const accessKeyId =
      this.configService.get<string>('STORAGE_ACCESS_KEY_ID') ||
      this.configService.get<string>('R2_ACCESS_KEY_ID') ||
      'minioadmin';
    const secretAccessKey =
      this.configService.get<string>('STORAGE_SECRET_ACCESS_KEY') ||
      this.configService.get<string>('R2_SECRET_ACCESS_KEY') ||
      'minioadminpassword';

    this.bucketName =
      this.configService.get<string>('STORAGE_BUCKET_NAME') ||
      this.configService.get<string>('R2_BUCKET_NAME') ||
      'social-media-assets';

    this.publicBaseUrl =
      this.configService.get<string>('STORAGE_PUBLIC_URL') ||
      this.configService.get<string>('R2_PUBLIC_URL');

    const forcePathStyle =
      this.configService.get<boolean>('STORAGE_FORCE_PATH_STYLE') ?? true;

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle,
    });
  }

  getBucketName(): string {
    return this.bucketName;
  }

  getClient(): S3Client {
    return this.s3Client;
  }

  generateFileKey(originalFilename: string, prefix = 'uploads'): string {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(6).toString('hex');
    const sanitizedName = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return prefix + '/' + timestamp + '-' + randomHex + '-' + sanitizedName;
  }

  async createPresignedUploadUrl(
    filename: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<PresignedUrlResponse> {
    const fileKey = this.generateFileKey(filename);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    const publicUrl = this.publicBaseUrl
      ? this.publicBaseUrl + '/' + fileKey
      : uploadUrl.split('?')[0];

    return {
      uploadUrl,
      fileKey,
      publicUrl,
      expiresIn,
    };
  }

  async createPresignedDownloadUrl(fileKey: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteObject(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    await this.s3Client.send(command);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const command = new HeadBucketCommand({
        Bucket: this.bucketName,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      this.logger.error('Storage health check failed: ' + (error as Error).message);
      return false;
    }
  }
}
