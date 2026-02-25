import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths always protected with the server-side admin secret.
// These routes should never be called from a browser.
const ADMIN_PATHS = ['/api/admin/', '/api/migrate/'];

// POST endpoints called from the browser, protected with the public API key.
const WRITE_PROTECTED_PATHS = ['/api/ai/assistant', '/api/dashboard/work-orders'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Handle CORS preflight — let OPTIONS through so the browser can proceed.
  if (method === 'OPTIONS') {
    return NextResponse.next();
  }

  // Admin / migrate routes: always require the server-side secret.
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath) {
    const provided = request.headers.get('x-admin-secret');
    const expected = process.env.ADMIN_SECRET;
    if (!expected || provided !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Write endpoints: require the public API key on POST requests.
  const isWritePath = WRITE_PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isWritePath && method === 'POST') {
    const provided = request.headers.get('x-api-key');
    const expected = process.env.NEXT_PUBLIC_API_KEY;
    if (!expected || provided !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Add performance and security headers
  const response = NextResponse.next();
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
