'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.hash)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        router.push('/?error=auth_failed')
      } else {
        router.push('/dashboard')
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
