import 'server-only';
import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

function getAdminApp(): App {
  const existingApps = getApps();
  const existingAdmin = existingApps.find((a) => a.name === 'admin');
  if (existingAdmin) {
    return existingAdmin;
  }

  // 1. Service account JSON in FIREBASE_SERVICE_ACCOUNT_KEY
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey && serviceAccountKey.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(serviceAccountKey);
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return initializeApp(
          {
            credential: cert(parsed),
            projectId: parsed.project_id,
          },
          'admin',
        );
      }
    } catch (e) {
      console.warn('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    }
  }

  // 2. Individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return initializeApp(
      {
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      },
      'admin',
    );
  }

  // 3. Fallback for environments with Application Default Credentials or build-time prerendering
  return initializeApp(
    {
      projectId: projectId || 'social-media-app-dev',
    },
    'admin',
  );
}

const adminApp = getAdminApp();
const adminAuth: Auth = getAuth(adminApp);

export { adminApp, adminAuth };
