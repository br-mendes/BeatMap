 'use client'

import React, { useState } from 'react';
import { Layout, Type, Sidebar, Monitor } from 'lucide-react';
import { useLayout } from '../../contexts/LayoutContext';

export const LayoutSettingsPanel: React.FC = () => {
  const { settings: layoutSettings, updateSettings: updateLayout, savePreset, presets, loadPreset, resetLayout } = useLayout();
  const [presetName, setPresetName] = useState('');

  const handleSavePreset = () => {
      if(presetName) {
          savePreset(presetName);
          setPresetName('');
          alert('Preset salvo!');
      }
  };

  return (
    <div className="bg-beatmap-card rounded-2xl p-6 border border-beatmap-border/10">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Layout className="text-beatmap-primary" size={20} /> Layout & Aparência
        </h2>
        
        <div className="space-y-6">
            {/* View Mode */}
            <div>
                <label className="text-sm font-medium text-beatmap-muted mb-2 block">Modo de Visualização Padrão</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { id: 'grid-compact', label: 'Compacto' },
                        { id: 'grid-normal', label: 'Normal' },
                        { id: 'cards', label: 'Expandido' },
                        { id: 'list', label: 'Lista' }
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => updateLayout({ mode: opt.id as any })}
                            className={`px-4 py-2 rounded-lg text-sm transition-all border ${layoutSettings.mode === opt.id 
                                ? 'bg-beatmap-primary/20 border-beatmap-primary text-beatmap-primary font-bold' 
                                : 'bg-beatmap-bg/30 border-beatmap-border/10 text-beatmap-muted hover:border-beatmap-border/30'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Font Size & Density */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-sm font-medium text-beatmap-muted mb-2 flex items-center gap-2">
                        <Type size={14} /> Tamanho da Fonte
                    </label>
                    <div className="flex bg-beatmap-bg/30 rounded-lg p-1 border border-beatmap-border/10">
                            {['small', 'normal', 'large'].map((s) => (
                                <button
                                key={s}
                                onClick={() => updateLayout({ fontSize: s as any })}
                                className={`flex-1 py-1.5 rounded-md text-xs capitalize transition-colors ${layoutSettings.fontSize === s ? 'bg-beatmap-card shadow-sm text-beatmap-text font-bold' : 'text-beatmap-muted'}`}
                                >
                                    {s}
                                </button>
                            ))}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-beatmap-muted mb-2 flex items-center gap-2">
                        <Monitor size={14} /> Densidade
                    </label>
                    <div className="flex bg-beatmap-bg/30 rounded-lg p-1 border border-beatmap-border/10">
                            {['compact', 'normal', 'expanded'].map((d) => (
                                <button
                                key={d}
                                onClick={() => updateLayout({ density: d as any })}
                                className={`flex-1 py-1.5 rounded-md text-xs capitalize transition-colors ${layoutSettings.density === d ? 'bg-beatmap-card shadow-sm text-beatmap-text font-bold' : 'text-beatmap-muted'}`}
                                >
                                    {d === 'normal' ? 'Normal' : d === 'compact' ? 'Alta' : 'Baixa'}
                                </button>
                            ))}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div>
                    <label className="text-sm font-medium text-beatmap-muted mb-2 flex items-center gap-2">
                    <Sidebar size={14} /> Barra Lateral
                </label>
                <div className="flex gap-3">
                    <button 
                        onClick={() => updateLayout({ sidebarPosition: 'left' })}
                        className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${layoutSettings.sidebarPosition === 'left' ? 'border-beatmap-primary bg-beatmap-primary/10' : 'border-beatmap-border/10'}`}
                    >
                        <div className="w-4 h-3 border-l-2 border-current"></div> Esquerda
                    </button>
                    <button 
                        onClick={() => updateLayout({ sidebarPosition: 'right' })}
                        className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${layoutSettings.sidebarPosition === 'right' ? 'border-beatmap-primary bg-beatmap-primary/10' : 'border-beatmap-border/10'}`}
                    >
                        <div className="w-4 h-3 border-r-2 border-current"></div> Direita
                    </button>
                        <button 
                        onClick={() => updateLayout({ sidebarPosition: 'hidden' })}
                        className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${layoutSettings.sidebarPosition === 'hidden' ? 'border-beatmap-primary bg-beatmap-primary/10' : 'border-beatmap-border/10'}`}
                    >
                        <div className="w-4 h-3 border border-dashed border-current"></div> Oculta
                    </button>
                </div>
            </div>

            {/* Presets */}
            <div className="pt-4 border-t border-beatmap-border/10">
                <h3 className="text-sm font-bold mb-3">Presets de Layout</h3>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {presets.map(p => (
                        <button 
                            key={p}
                            onClick={() => loadPreset(p)}
                            className="px-3 py-1 bg-beatmap-bg/50 border border-beatmap-border/20 rounded-full text-xs hover:border-beatmap-primary hover:text-beatmap-primary whitespace-nowrap"
                        >
                            {p}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Nome do preset..." 
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        className="bg-beatmap-bg/30 border border-beatmap-border/10 rounded-lg px-3 py-1.5 text-sm flex-1 focus:border-beatmap-primary outline-none"
                    />
                    <button onClick={handleSavePreset} className="bg-beatmap-primary hover:bg-beatmap-primary/80 text-white px-4 rounded-lg text-sm font-medium">
                        Salvar
                    </button>
                    <button onClick={resetLayout} className="bg-transparent border border-beatmap-border/10 hover:bg-beatmap-bg/50 text-beatmap-muted px-4 rounded-lg text-sm font-medium">
                        Resetar
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
