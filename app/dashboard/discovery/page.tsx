'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/app/providers'
import { fetchRecommendations, fetchUserTopItems } from '@/lib/spotify'
import type { Track } from '@/types'

export default function ForYouPage() {
  const { session } = useAuth()
  const accessToken = useMemo(() => session?.provider_token as string | undefined, [session])
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    setTracks([])
    try {
      const topArtists = await fetchUserTopItems(accessToken, 'artists', 'medium_term', 10)
      const seedArtists = topArtists.map((a: any) => a.id).slice(0, 3)
      const recs = await fetchRecommendations(accessToken, seedArtists, [], [], 24)
      setTracks(recs)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Para Voce</h1>
        <p className="text-beatmap-muted">Recomendacoes baseadas no seu gosto.</p>
      </div>

      {!accessToken ? (
        <div className="bg-beatmap-card rounded-xl p-4 border border-beatmap-border/10">
          <p className="text-beatmap-muted">Token do Spotify nao encontrado. Refaça o login.</p>
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={loading}
          className="bg-beatmap-primary text-black font-bold px-4 py-2 rounded-full disabled:opacity-60"
        >
          {loading ? 'Gerando...' : 'Gerar recomendacoes'}
        </button>
      )}

      {error ? <p className="text-beatmap-muted">Erro: {error}</p> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((t) => (
          <a
            key={t.id}
            href={t.external_urls?.spotify}
            target="_blank"
            rel="noreferrer"
            className="bg-beatmap-card rounded-2xl border border-beatmap-border/10 p-4"
          >
            <div className="font-semibold truncate">{t.name}</div>
            <div className="text-sm text-beatmap-muted truncate">{t.artists?.map((a) => a.name).join(', ')}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
