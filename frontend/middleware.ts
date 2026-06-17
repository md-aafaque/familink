import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          req.cookies.set({
            name,
            value,
            ...options,
          })

          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })

          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })

          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })

          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Use getUser() instead of getSession() as recommended for SSR/Middleware security
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = req.nextUrl.clone()

  // Define route types
  const isAuthRoute = url.pathname === '/login' || url.pathname === '/signup'
  const isLandingPageRoute = url.pathname === '/'
  const isPublicRoute = isLandingPageRoute || url.pathname.startsWith('/join/')
  const isProtectedRoute = !isAuthRoute && !isPublicRoute

  console.log(`[Middleware] Path: ${url.pathname}, Auth: ${!!user ? 'YES' : 'NO'}`);

  // 1. If user is logged in and tries to access login/signup/landing -> Redirect to dashboard
  if (user && (isAuthRoute || isLandingPageRoute)) {
    console.log(`[Middleware] Redirecting logged-in user from ${url.pathname} to /dashboard`);
    url.pathname = '/dashboard'
    const redirectRes = NextResponse.redirect(url)
    
    // Transfer all current cookies to the redirect response
    res.cookies.getAll().forEach((cookie) => {
        redirectRes.cookies.set(cookie.name, cookie.value)
    })
    
    return redirectRes
  }

  // 2. If user is NOT logged in and tries to access protected route -> Redirect to login
  if (!user && isProtectedRoute) {
    console.log(`[Middleware] Redirecting unauthenticated user from ${url.pathname} to /login`);
    const redirectTo = encodeURIComponent(url.pathname + url.search)
    url.pathname = '/login'
    url.search = `?redirectTo=${redirectTo}`
    const redirectRes = NextResponse.redirect(url)
    
    // Transfer all current cookies to the redirect response
    res.cookies.getAll().forEach((cookie) => {
        redirectRes.cookies.set(cookie.name, cookie.value)
    })
    
    return redirectRes
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
