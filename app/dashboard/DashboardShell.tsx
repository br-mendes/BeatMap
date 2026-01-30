'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { Layout } from '@/components/Layout'
import { fetchUserProfile } from '@/lib/spotify'
import type { User as SpotifyUser } from '@/types'

type TabId = 'dashboard' | 'discovery' | 'stats' | 'history' | 'playlists' | 'settings'

export default function DashboardShell() {
  const { user: supabaseUser, session, isLoading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const accessToken = useMemo(() => session?.provider_token as string | undefined, [session])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setProfileError(null)
      setSpotifyUser(null)

      if (!accessToken) return

      try {
        const profile = await fetchUserProfile(accessToken)
        if (!cancelled) setSpotifyUser(profile)
      } catch (e) {
        if (!cancelled) setProfileError(String(e))
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-beatmap-dark flex items-center justify-center">
        <p className="text-beatmap-text">Carregando...</p>
      </div>
    )
  }

  if (!supabaseUser) {
    return (
      <div className="min-h-screen bg-beatmap-dark flex items-center justify-center">
        <p className="text-beatmap-text">Sessao expirada. Volte para a home.</p>
      </div>
    )
  }

  const headerUser = spotifyUser || ({ id: supabaseUser.id, email: supabaseUser.email } as any)

  return (
    <LayoutProvider>
      <Layout
        user={headerUser as any}
        onLogout={signOut}
        activeTab={activeTab}
        setActiveTab={setActiveTab as any}
      >
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{activeTab === 'dashboard' ? 'Descobrir' : activeTab}</h1>
          {!accessToken ? (
            <div className="bg-beatmap-card rounded-xl p-4 border border-beatmap-border/10">
              <p className="text-beatmap-muted">
                Token do Spotify nao encontrado na sessao. Refaça o login.
              </p>
            </div>
          ) : null}
          {profileError ? (
            <div className="bg-beatmap-card rounded-xl p-4 border border-beatmap-border/10">
              <p className="text-beatmap-muted">Falha ao carregar perfil do Spotify: {profileError}</p>
            </div>
          ) : null}
          <div className="bg-beatmap-card rounded-2xl p-6 border border-beatmap-border/10">
            <p className="text-beatmap-muted">
              Esta area ainda esta sendo reativada na migracao para Next.js. Proximos passos: telas de Discovery/Stats/History/Settings e integracao completa com DB.
            </p>
          </div>
        </div>
      </Layout>
    </LayoutProvider>
  )
}
