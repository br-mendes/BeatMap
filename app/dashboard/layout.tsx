'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/app/providers'
import { fetchUserProfile } from '@/lib/spotify'
import type { User as SpotifyUser } from '@/types'

type TabId = 'dashboard' | 'discovery' | 'stats' | 'history' | 'playlists' | 'settings'

function tabFromPath(pathname: string): TabId {
  if (pathname.startsWith('/dashboard/settings')) return 'settings'
  if (pathname.startsWith('/dashboard/playlists')) return 'playlists'
  if (pathname.startsWith('/dashboard/history')) return 'history'
  if (pathname.startsWith('/dashboard/stats')) return 'stats'
  if (pathname.startsWith('/dashboard/discovery')) return 'discovery'
  return 'dashboard'
}

function pathFromTab(tab: string): string {
  if (tab === 'settings') return '/dashboard/settings'
  if (tab === 'playlists') return '/dashboard/playlists'
  if (tab === 'history') return '/dashboard/history'
  if (tab === 'stats') return '/dashboard/stats'
  if (tab === 'discovery') return '/dashboard/discovery'
  return '/dashboard/discover'
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user: supabaseUser, session, isLoading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const activeTab = useMemo(() => tabFromPath(pathname), [pathname])
  const accessToken = useMemo(() => session?.provider_token as string | undefined, [session])

  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null)

  useEffect(() => {
    if (!isLoading && !supabaseUser) {
      router.replace('/')
    }
  }, [isLoading, supabaseUser, router])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setSpotifyUser(null)
      if (!accessToken) return
      try {
        const profile = await fetchUserProfile(accessToken)
        if (!cancelled) setSpotifyUser(profile)
      } catch {
        // ignore
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [accessToken])

  if (isLoading || !supabaseUser) {
    return (
      <div className="min-h-screen bg-beatmap-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-beatmap-primary mx-auto mb-4"></div>
          <p className="text-beatmap-text">Carregando...</p>
        </div>
      </div>
    )
  }

  const headerUser = spotifyUser || ({ id: supabaseUser.id, email: supabaseUser.email } as any)

  const setActiveTab = (tab: string) => {
    router.push(pathFromTab(tab))
  }

  return (
    <LayoutProvider>
      <Layout
        user={headerUser as any}
        onLogout={signOut}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      >
        {children}
      </Layout>
    </LayoutProvider>
  )
}
