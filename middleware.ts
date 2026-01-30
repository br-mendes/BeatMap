import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Only protect private routes. Avoid invoking Supabase on public routes,
  // since missing env vars or Edge runtime incompatibilities would break the whole site.
  if (!req.nextUrl.pathname.startsWith('/dashboard')) {
    return res
  }

  try {
    // If env vars are not present in this environment, skip protection (fail-open)
    // so the deployment doesn't 500 on every request.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return res
    }

    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return res
  } catch {
    // Fail-open for middleware runtime errors.
    return res
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
