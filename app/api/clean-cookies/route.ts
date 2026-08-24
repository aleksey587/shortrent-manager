import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url))
  
  // Clear all cookies
  request.cookies.getAll().forEach(cookie => {
    response.cookies.delete(cookie.name)
    response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
  })

  return response
}
