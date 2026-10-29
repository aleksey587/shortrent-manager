import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user') || 'theodoros'
  let email = `${user}@gmail.com`
  if (user === 'theodoros' || user === 'callisto') {
    email = 'theodoroskolokuthas@gmail.com'
  } else if (user === 'admin' || user === 'alex' || user === 'gjokas') {
    email = 'gjokas.al@gmail.com'
  }

  const response = NextResponse.redirect(new URL('/dashboard', request.url))
  
  response.cookies.set('greekhost_magic_user', email, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year auto-login
    httpOnly: false,
    sameSite: 'lax',
  })

  return response
}
