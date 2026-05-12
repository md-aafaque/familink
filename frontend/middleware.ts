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

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Removed server-side redirects to prevent loop with localStorage auth.
  // Auth protection is handled client-side in AuthProvider/AppLayout.

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}