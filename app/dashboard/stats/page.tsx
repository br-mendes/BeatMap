'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers'
import { getUserStatistics } from '@/lib/db'
import type { UserStats } from '@/types'

export default function StatsPage() {
  const { user } = useAuth()
  const userId = useMemo(() => (user?.id as string | undefined), [user])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      setStats(null)
      if (!userId) {
        setLoading(false)
        return
      }
      try {
        const data = await getUserStatistics(userId)
        if (!cancelled) setStats(data)
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Estatisticas</h1>
        <p className="text-beatmap-muted">Resumo das suas playlists salvas no BeatMap.</p>
      </div>

      {loading ? <p className="text-beatmap-muted">Carregando...</p> : null}
      {error ? <p className="text-beatmap-muted">Erro: {error}</p> : null}

      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-beatmap-card rounded-2xl p-4 border border-beatmap-border/10">
            <div className="text-sm text-beatmap-muted">Playlists</div>
            <div className="text-2xl font-bold">{stats.totalPlaylists}</div>
          </div>
          <div className="bg-beatmap-card rounded-2xl p-4 border border-beatmap-border/10">
            <div className="text-sm text-beatmap-muted">Tracks salvas</div>
            <div className="text-2xl font-bold">{stats.totalTracksSaved}</div>
          </div>
          <div className="bg-beatmap-card rounded-2xl p-4 border border-beatmap-border/10">
            <div className="text-sm text-beatmap-muted">Tempo total</div>
            <div className="text-2xl font-bold">{Math.round(stats.totalTimeMs / 60000)} min</div>
          </div>
          <div className="bg-beatmap-card rounded-2xl p-4 border border-beatmap-border/10">
            <div className="text-sm text-beatmap-muted">Artistas unicos</div>
            <div className="text-2xl font-bold">{stats.uniqueArtists}</div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
