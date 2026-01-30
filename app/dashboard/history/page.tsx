'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers'
import { getUserHistory } from '@/lib/db'
import type { HistoryItem } from '@/types'

export default function HistoryPage() {
  const { user } = useAuth()
  const userId = useMemo(() => (user?.id as string | undefined), [user])

  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      setItems([])
      if (!userId) {
        setLoading(false)
        return
      }
      try {
        const data = await getUserHistory(userId)
        if (!cancelled) setItems(data)
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
        <h1 className="text-3xl font-bold">Historico</h1>
        <p className="text-beatmap-muted">Playlists que voce ja exportou/salvou.</p>
      </div>

      {loading ? <p className="text-beatmap-muted">Carregando...</p> : null}
      {error ? <p className="text-beatmap-muted">Erro: {error}</p> : null}

      <div className="space-y-3">
        {items.map((h) => (
          <a
            key={h.id}
            href={h.spotifyUrl}
            target="_blank"
            rel="noreferrer"
            className="block bg-beatmap-card rounded-2xl border border-beatmap-border/10 p-4"
          >
            <div className="font-semibold">{h.playlistName}</div>
            <div className="text-sm text-beatmap-muted">{h.trackCount} tracks • {new Date(h.createdAt).toLocaleString()}</div>
          </a>
        ))}
        {items.length === 0 && !loading ? (
          <div className="text-beatmap-muted">Nenhum historico ainda.</div>
        ) : null}
      </div>
    </div>
  )
}
