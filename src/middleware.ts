import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Public routes
  if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (isLoggedIn && role) {
      return NextResponse.redirect(new URL(`/${role}`, req.url));
    }
    return NextResponse.next();
  }

  // Protected routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role-based access
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(`/${role}`, req.url));
  }
  if (pathname.startsWith('/professor') && role !== 'professor') {
    return NextResponse.redirect(new URL(`/${role}`, req.url));
  }
  if (pathname.startsWith('/student') && role !== 'student') {
    return NextResponse.redirect(new URL(`/${role}`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
