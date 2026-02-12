import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const cookieStore = cookies();
  
  // Get all cookies
  const allCookies: Record<string, string> = {};
  cookieStore.getAll().forEach(cookie => {
    allCookies[cookie.name] = cookie.value;
  });

  // Try to get JWT token directly
  const token = await getToken({ 
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    hasSession: !!session,
    session: session,
    hasToken: !!token,
    token: token ? {
      email: token.email,
      role: token.role,
      sub: token.sub,
      iat: token.iat,
      exp: token.exp,
    } : null,
    cookies: allCookies,
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    }
  });
}
