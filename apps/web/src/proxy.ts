import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req: NextRequest & { auth: unknown }) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const publicPaths = ['/login', '/register']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  if (!isLoggedIn && !isPublic && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (!isLoggedIn && pathname === '/') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
