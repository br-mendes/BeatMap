'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-beatmap-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-beatmap-primary mx-auto mb-4"></div>
          <p className="text-beatmap-text">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-beatmap-dark text-beatmap-text p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-beatmap-muted">Bem-vindo, {user.email}!</p>
      <p className="mt-4">Aqui você pode descobrir novos lançamentos e gerenciar suas playlists.</p>
    </div>
  )
}
