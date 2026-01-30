'use client'

import { LayoutSettingsPanel } from '@/components/settings/LayoutSettings'
import { ThemeEditorPanel } from '@/components/settings/ThemeEditor'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuracoes</h1>
        <p className="text-beatmap-muted">Personalize tema, layout e preferencias.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LayoutSettingsPanel />
        <ThemeEditorPanel />
      </div>
    </div>
  )
}
