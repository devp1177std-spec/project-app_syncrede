import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@social/validation';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  public adminAuth?: Auth;

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    try {
      const existingApps = getApps();
      const existingAdmin = existingApps.find((a) => a.name === 'api-admin') || existingApps[0];
      if (existingAdmin) {
        this.adminAuth = getAuth(existingAdmin);
        return;
      }

      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountKey && serviceAccountKey.trim().startsWith('{')) {
        const parsed = JSON.parse(serviceAccountKey);
        if (parsed.project_id && parsed.client_email && parsed.private_key) {
          const app = initializeApp(
            {
              credential: cert(parsed),
              projectId: parsed.project_id,
            },
            'api-admin',
          );
          this.adminAuth = getAuth(app);
          this.logger.log('Firebase Admin initialized with service account key');
          return;
        }
      }

      const projectId =
        process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        const app = initializeApp(
          {
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
            projectId,
          },
          'api-admin',
        );
        this.adminAuth = getAuth(app);
        this.logger.log('Firebase Admin initialized with credentials');
        return;
      }

      // Fallback for ADC or local environments
      const app = initializeApp(
        {
          projectId: projectId || 'social-media-dev',
        },
        'api-admin',
      );
      this.adminAuth = getAuth(app);
      this.logger.log('Firebase Admin initialized with default configuration');
    } catch (e: any) {
      this.logger.warn(`Firebase Admin initialization notice: ${e?.message}`);
    }
  }

  /**
   * Validates incoming request authorization with Firebase Admin SDK verifyIdToken.
   */
  async validateRequest(request: any): Promise<{ user: any; session: any } | null> {
    const authHeader = request.headers?.authorization;
    if (!authHeader) {
      return null;
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) {
      return null;
    }

    if (!this.adminAuth) {
      this.logger.warn('Firebase Admin Auth not initialized');
      return null;
    }

    try {
      const decoded = await this.adminAuth.verifyIdToken(token);
      if (!decoded || !decoded.uid) {
        return null;
      }

      // Look up or link user in database
      let dbUser: any = null;
      try {
        dbUser = await this.prisma.client.user.findFirst({
          where: {
            OR: [
              { id: decoded.uid },
              ...(decoded.email ? [{ email: decoded.email }] : []),
            ],
          },
        });

        if (!dbUser && decoded.email) {
          dbUser = await this.prisma.client.user.create({
            data: {
              id: decoded.uid,
              email: decoded.email,
              name: decoded.name || decoded.email.split('@')[0],
              emailVerified: Boolean(decoded.email_verified),
              image: decoded.picture || null,
              role: 'user',
            },
          });
        }
      } catch (dbError) {
        this.logger.debug(`Database user query fallback: ${dbError}`);
      }

      const user = dbUser || {
        id: decoded.uid,
        email: decoded.email || '',
        name: decoded.name || 'User',
        emailVerified: Boolean(decoded.email_verified),
        role: (decoded as any).role || 'user',
      };

      return {
        user,
        session: decoded,
      };
    } catch (err: any) {
      this.logger.debug(`Token verification failed: ${err?.message}`);
      return null;
    }
  }
}
