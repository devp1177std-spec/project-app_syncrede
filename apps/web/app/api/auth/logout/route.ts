import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/firebase/server-auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    cookieStore.delete({
      name: SESSION_COOKIE_NAME,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Logout API Error]:', error);
    // Ensure cookie is deleted regardless
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true });
  }
}
