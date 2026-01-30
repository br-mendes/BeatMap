'use client'

import { useMemo } from 'react'
import { useAuth } from '@/app/providers'

export default function PlaylistsPage() {
  const { user } = useAuth()
  const userId = useMemo(() => (user?.id as string | undefined), [user])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minhas Playlists</h1>
        <p className="text-beatmap-muted">Em breve: lista dedicada (por enquanto use Historico).</p>
      </div>

      <div className="bg-beatmap-card rounded-2xl border border-beatmap-border/10 p-4">
        <p className="text-beatmap-muted">User ID: {userId || '-'}</p>
      </div>
    </div>
  )
}
