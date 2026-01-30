'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search)

      const providerError = params.get('error')
      const providerErrorDescription = params.get('error_description')
      if (providerError) {
        const msg = providerErrorDescription || providerError
        console.error('OAuth provider error:', msg)
        router.replace(`/?error=auth_failed&message=${encodeURIComponent(msg)}`)
        return
      }

      const code = params.get('code')
      if (!code) {
        console.error('OAuth callback missing code')
        router.replace('/?error=auth_failed&message=missing_code')
        return
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Error exchanging code for session:', error)
          router.replace(`/?error=auth_failed&message=${encodeURIComponent(error.message)}`)
          return
        }

        // sanity check
        const { data } = await supabase.auth.getSession()
        if (!data?.session) {
          console.error('Session not found after code exchange')
          router.replace('/?error=auth_failed&message=session_missing')
          return
        }

        router.replace('/dashboard')
      } catch (e) {
        console.error('Auth callback unexpected error:', e)
        router.replace('/?error=auth_failed&message=unexpected')
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen bg-beatmap-dark flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-beatmap-primary mx-auto mb-4"></div>
        <p className="text-beatmap-text">Autenticando...</p>
      </div>
    </div>
  )
}
