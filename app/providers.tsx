'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

interface AuthContextType {
  user: any
  session: any
  isLoading: boolean
  signInWithSpotify: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user || null)
      setIsLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
      setUser(session?.user || null)
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  const signInWithSpotify = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        scopes: [
          'user-read-email',
          'user-read-private',
          'playlist-modify-public',
          'playlist-modify-private',
          'user-library-read',
          'user-top-read',
          'ugc-image-upload'
        ].join(' '),
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) console.error('Error signing in:', error)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const value = {
    user,
    session,
    isLoading,
    signInWithSpotify,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
