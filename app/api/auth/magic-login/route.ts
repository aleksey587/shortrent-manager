import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user') || 'theodoros'
  const email = (user === 'theodoros' || user === 'callisto') ? 'theodoroskolokuthas@gmail.com' : `${user}@gmail.com`

  const response = NextResponse.redirect(new URL('/dashboard', request.url))
  
  response.cookies.set('greekhost_magic_user', email, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year auto-login
    httpOnly: false,
    sameSite: 'lax',
  })

  return response
}
