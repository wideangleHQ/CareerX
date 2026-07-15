import { NextRequest, NextResponse } from 'next/server';

const CANDIDATE_DOMAIN = process.env.NEXT_PUBLIC_CANDIDATE_DOMAIN ?? '';
const HR_DOMAIN = process.env.NEXT_PUBLIC_HR_DOMAIN ?? '';

const PUBLIC_ROUTES = new Set([
  '/',
  '/jobs',
  '/apply',
  '/apply/success',
  '/book-interview',
]);

const HR_ROUTES = new Set([
  '/dashboard',
  '/candidates',
  '/applications',
  '/offers',
  '/reports',
  '/notifications',
  '/departments',
  '/interviews',
  '/settings',
]);

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith('/jobs/')) return true;
  return false;
}

function isHrRoute(pathname: string): boolean {
  if (HR_ROUTES.has(pathname)) return true;
  for (const route of HR_ROUTES) {
    if (pathname.startsWith(route + '/')) return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  const host = request.headers.get('host') ?? '';
  const { pathname } = request.nextUrl;

  if (pathname === '/auth/exchange' || pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  if (host === CANDIDATE_DOMAIN) {
    if (!isPublicRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url, 307);
    }
    return NextResponse.next();
  }

  if (host === HR_DOMAIN) {
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url, 307);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|images|fonts|assets|manifest\\.json).*)',
  ],
};
