import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'lv_session';
const PUBLIC_PATHS = ['/login'];

/**
 * Edge route guard. Redirects unauthenticated users to /login and prevents
 * authenticated users from seeing the login page. Presence of the httpOnly
 * session cookie is the signal; full token validation happens server-side in
 * the BFF on each data request.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (pathname === '/') {
    return NextResponse.redirect(new URL(hasSession ? '/dashboard' : '/login', request.url));
  }

  if (!hasSession && !isPublic) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
