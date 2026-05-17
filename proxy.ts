import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';

const COOKIE_NAME = 'bj_device_id';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const UUID_RE = /^[0-9a-f-]{36}$/i;

export function proxy(request: NextRequest) {
  const existing = request.cookies.get(COOKIE_NAME)?.value;
  if (existing && UUID_RE.test(existing)) {
    return NextResponse.next();
  }

  const deviceId = randomUUID();

  // Make the new cookie visible to downstream Server Components in this same
  // request by mutating request.cookies and forwarding the request.
  request.cookies.set(COOKIE_NAME, deviceId);

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  response.cookies.set(COOKIE_NAME, deviceId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
