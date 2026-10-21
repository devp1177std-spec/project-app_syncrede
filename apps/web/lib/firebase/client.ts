import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth, GoogleAuthProvider } from 'firebase/auth';

const cleanKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim().replace(/^["']|["']$/g, '');
// Fallback to a validly formatted stub during build-time SSR page prerendering if unconfigured.
const apiKey = cleanKey || 'AIzaSyA00000000000000000000000000000000';

const firebaseConfig = {
  apiKey,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim().replace(/^["']|["']$/g, '') ||
    'social-media-app-dev.firebaseapp.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim().replace(/^["']|["']$/g, '') ||
    'social-media-app-dev',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim().replace(/^["']|["']$/g, '') ||
    'social-media-app-dev.appspot.com',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim().replace(/^["']|["']$/g, '') ||
    '123456789012',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim().replace(/^["']|["']$/g, '') ||
    '1:123456789012:web:abcdef1234567890',
};

// Initialize Firebase App as a singleton
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);

// Connect to Firebase Auth Emulator if configured or running in development with emulator flag
if (typeof window !== 'undefined') {
  const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  if (emulatorHost) {
    try {
      connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true });
    } catch {
      // Ignore if emulator was already connected
    }
  }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, googleProvider };
