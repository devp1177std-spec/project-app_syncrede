import 'server-only';
import { cookies } from 'next/headers';
import { adminAuth } from './admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

export const SESSION_COOKIE_NAME = '__session';
// 5 days in milliseconds
export const SESSION_EXPIRY_MS = 5 * 24 * 60 * 60 * 1000;

export interface ServerUserSession {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
  claims: DecodedIdToken;
}

/**
 * Retrieves and cryptographically verifies the current user's session cookie.
 * Can be called inside Next.js Server Components, Server Actions, or Route Handlers.
 */
export async function getServerUserSession(): Promise<ServerUserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify session cookie and ensure it has not been revoked
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      name: decodedClaims.name,
      picture: decodedClaims.picture,
      emailVerified: decodedClaims.email_verified,
      claims: decodedClaims,
    };
  } catch {
    // If verification fails or cookie expired/revoked, return null
    return null;
  }
}
