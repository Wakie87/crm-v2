import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { auth } from './lib/auth';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/auth/sign-in', '/auth/sign-up'];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if it's an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Check for session using Better Auth's helper
  const sessionCookie = getSessionCookie(req);
  const hasSession = !!sessionCookie;

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not logged in and trying to access protected routes, redirect to sign-in
  if (!hasSession && isProtectedRoute) {
    const signInUrl = new URL('/auth/sign-in', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // For protected routes with active session, check if superadmin needs special handling
  if (hasSession && isProtectedRoute) {
    try {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (session?.user) {
        const response = NextResponse.next();
        
        // Add superadmin flag to headers for downstream components
        if (session.user.role === 'superadmin') {
          response.headers.set('x-user-is-superadmin', 'true');
        }
        
        return response;
      }
    } catch (error) {
      // If session validation fails, continue normally
      console.error('Session validation error in middleware:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
