import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isTokenExpiringSoon } from '@/shared/lib/auth/tokens';
import { authApi } from '@/shared/lib/api/auth';

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const path = request.nextUrl.pathname;

  // Protect /app/* routes
  if (path.startsWith('/app')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if token needs refresh (expires in <5 minutes)
    if (isTokenExpiringSoon(accessToken, 5 * 60 * 1000) && refreshToken) {
      const newTokens = await authApi.refresh(refreshToken);

      if (newTokens.success) {
        const response = NextResponse.next();

        response.cookies.set('accessToken', newTokens.data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 15, // 15 minutes
        });

        response.cookies.set('refreshToken', newTokens.data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
      } else {
        // Refresh failed, redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        return response;
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if ((path === '/login' || path === '/register') && accessToken) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/login', '/register'],
};
