'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers'
import { fetchNewReleases } from '@/lib/spotify'
import type { Album } from '@/types'

export default function DiscoverPage() {
  const { session } = useAuth()
  const accessToken = useMemo(() => session?.provider_token as string | undefined, [session])

  const [items, setItems] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      setItems([])

      if (!accessToken) {
        setLoading(false)
        return
      }

      try {
        const data = await fetchNewReleases(accessToken, 24, 0)
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
  }, [accessToken])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Descobrir</h1>
        <p className="text-beatmap-muted">Lancamentos recentes no Spotify.</p>
      </div>

      {!accessToken ? (
        <div className="bg-beatmap-card rounded-xl p-4 border border-beatmap-border/10">
          <p className="text-beatmap-muted">Token do Spotify nao encontrado. Refaça o login.</p>
        </div>
      ) : null}

      {loading ? <p className="text-beatmap-muted">Carregando...</p> : null}
      {error ? <p className="text-beatmap-muted">Erro: {error}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((a) => (
          <a
            key={a.id}
            href={a.external_urls?.spotify}
            target="_blank"
            rel="noreferrer"
            className="bg-beatmap-card rounded-2xl border border-beatmap-border/10 p-4 hover:border-beatmap-border/30 transition"
          >
            <div className="flex gap-3">
              {a.images?.[0]?.url ? (
                <img src={a.images[0].url} alt={a.name} className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-beatmap-dark" />
              )}
              <div className="min-w-0">
                <div className="font-semibold truncate">{a.name}</div>
                <div className="text-sm text-beatmap-muted truncate">
                  {a.artists?.map((x) => x.name).join(', ')}
                </div>
                <div className="text-xs text-beatmap-muted mt-1">{a.release_date}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
