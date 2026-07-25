import { NextResponse } from 'next/server';

// admin.services34.fr is the same Next.js deployment as services34.fr —
// this rewrites every request coming in on that subdomain to the /admin
// section, so no separate Vercel project/domain setup is needed beyond
// adding admin.services34.fr as an alias domain pointing here.
export function middleware(request) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  if (host.startsWith('admin.') && !pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|images|robots.txt|sitemap.xml).*)'],
};
