import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { SESSION_COOKIE_NAME, SESSION_EXPIRY_MS } from '@/lib/firebase/server-auth';

export async function POST(request: NextRequest) {
  try {
    // 1. CSRF Protection: Verify request origin / custom header
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const xRequestedWith = request.headers.get('x-requested-with');

    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { success: false, error: 'Cross-site request forgery detected' },
          { status: 403 },
        );
      }
    }

    if (!xRequestedWith && !origin) {
      // In browser fetch, custom headers or origin are sent
      return NextResponse.json(
        { success: false, error: 'Forbidden request' },
        { status: 403 },
      );
    }

    // 2. Parse ID Token from body or authorization header
    let idToken: string | undefined;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.slice(7);
    } else {
      const body = await request.json().catch(() => ({}));
      idToken = body.idToken;
    }

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'ID token is required' },
        { status: 400 },
      );
    }

    // 3. Verify the ID token using Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);

    // 4. Create the session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY_MS,
    });

    // 5. Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: Math.floor(SESSION_EXPIRY_MS / 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
      },
    });
  } catch (error: any) {
    console.error('[Session API Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to create authenticated session',
      },
      { status: 401 },
    );
  }
}
