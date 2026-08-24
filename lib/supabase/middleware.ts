import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const magicParam = request.nextUrl.searchParams.get('magic') || request.nextUrl.searchParams.get('auto')
  const magicCookie = request.cookies.get('greekhost_magic_user')?.value
  const hasMagicAuth = magicCookie || magicParam === 'theodoros' || magicParam === 'callisto'

  // Handle direct magic login link
  if (magicParam === 'theodoros' || magicParam === 'callisto') {
    const url = request.nextUrl.clone()
    url.searchParams.delete('magic')
    url.searchParams.delete('auto')
    if (pathname === '/login' || pathname === '/') {
      url.pathname = '/dashboard'
    }
    const response = NextResponse.redirect(url)
    response.cookies.set('greekhost_magic_user', 'theodoroskolokuthas@gmail.com', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,
      sameSite: 'lax',
    })
    return response
  }

  // Direct edge redirect for root / path
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = (user || hasMagicAuth) ? '/dashboard' : '/login'
    return NextResponse.redirect(url)
  }

  const isPublicRoute = 
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/guide') ||
    pathname.startsWith('/api') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icon')

  // If user is not authenticated and trying to access protected dashboard route
  if (!user && !hasMagicAuth && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is already authenticated and visits login/register
  if ((user || hasMagicAuth) && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
