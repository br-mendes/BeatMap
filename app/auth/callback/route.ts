import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')

  if (error) {
    const msg = errorDescription || error
    return NextResponse.redirect(
      new URL(`/?error=auth_failed&message=${encodeURIComponent(msg)}`, url.origin)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=auth_failed&message=missing_code', url.origin))
  }

  try {
    const supabase = createSupabaseServerClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        new URL(`/?error=auth_failed&message=${encodeURIComponent(exchangeError.message)}`, url.origin)
      )
    }

    return NextResponse.redirect(new URL('/dashboard', url.origin))
  } catch {
    return NextResponse.redirect(new URL('/?error=auth_failed&message=unexpected', url.origin))
  }
}
