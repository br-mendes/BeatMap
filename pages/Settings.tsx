import React, { useState, useEffect } from 'react';
import { Bell, Mail, Calendar, Save, CheckCircle, Palette, Share2, Download, Plus, Trash } from 'lucide-react';
import { THEMES, applyTheme, getSavedTheme, saveTheme, exportTheme, importTheme } from '../lib/theme';
import { Theme } from '../types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklySummary: true,
    notifyNewReleases: true
  });
  
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [customTheme, setCustomTheme] = useState<Theme>({
    id: 'custom',
    name: 'Meu Tema',
    colors: { ...THEMES[0].colors }
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const saved = getSavedTheme();
    setCurrentTheme(saved);
  }, []);

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleThemeSelect = (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    saveTheme(theme);
    if (!theme.isCustom) {
        setIsEditing(false);
    }
  };

  const handleColorChange = (key: keyof Theme['colors'], value: string) => {
    const updated = {
        ...customTheme,
        colors: { ...customTheme.colors, [key]: value }
    };
    setCustomTheme(updated);
    applyTheme(updated); // Live preview
  };

  const saveCustomTheme = () => {
      const newTheme = { ...customTheme, id: `custom-${Date.now()}`, isCustom: true };
      handleThemeSelect(newTheme);
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
  };

  const handleShareTheme = () => {
      const code = exportTheme(currentTheme);
      navigator.clipboard.writeText(code);
      alert('Código do tema copiado para a área de transferência!');
  };

  const handleImportTheme = () => {
      const code = prompt('Cole o código do tema aqui:');
      if (code) {
          const imported = importTheme(code);
          if (imported) {
              setCustomTheme(imported);
              handleThemeSelect(imported);
              alert('Tema importado com sucesso!');
          } else {
              alert('Código inválido.');
          }
      }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="bg-gradient-to-r from-beatmap-card to-transparent p-8 rounded-3xl border border-beatmap-border/10">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-beatmap-muted">Personalize sua experiência no BeatMap.</p>
      </div>

      <div className="grid gap-8">
        
        {/* --- PERSONALIZATION SECTION --- */}
        <div className="bg-beatmap-card rounded-2xl p-6 border border-beatmap-border/10">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Palette className="text-beatmap-primary" size={20} /> Personalização
                </h2>
                <div className="flex gap-2">
                     <button onClick={handleImportTheme} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-beatmap-border/10 rounded-full hover:bg-beatmap-border/20 transition-colors">
                         <Download size={14} /> Importar
                     </button>
                     <button onClick={handleShareTheme} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-beatmap-border/10 rounded-full hover:bg-beatmap-border/20 transition-colors">
                         <Share2 size={14} /> Compartilhar Atual
                     </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                {THEMES.map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => handleThemeSelect(theme)}
                        className={`relative group p-1 rounded-xl transition-all ${currentTheme.id === theme.id ? 'ring-2 ring-beatmap-primary ring-offset-2 ring-offset-beatmap-bg' : 'hover:ring-1 hover:ring-beatmap-muted'}`}
                    >
                        <div className="h-20 rounded-lg overflow-hidden border border-beatmap-border/10 relative" style={{ background: theme.colors.bg }}>
                            <div className="absolute top-2 left-2 w-12 h-8 rounded" style={{ background: theme.colors.card }}></div>
                            <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full" style={{ background: theme.colors.primary }}></div>
                        </div>
                        <div className="text-center mt-2 text-xs font-medium truncate">{theme.name}</div>
                    </button>
                ))}
            </div>

            <div className="border-t border-beatmap-border/10 pt-6">
                {!isEditing ? (
                    <button 
                        onClick={() => {
                            setIsEditing(true);
                            setCustomTheme({ ...currentTheme, isCustom: true, id: 'custom-draft', name: 'Meu Tema Personalizado' });
                        }}
                        className="flex items-center gap-2 text-sm font-bold text-beatmap-primary hover:text-beatmap-secondary transition-colors"
                    >
                        <Plus size={16} /> Criar Novo Tema
                    </button>
                ) : (
                    <div className="animate-in fade-in slide-in-from-top-4 space-y-4 bg-beatmap-bg/50 p-4 rounded-xl border border-beatmap-border/10">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-sm">Editor de Tema</h3>
                            <input 
                                type="text" 
                                value={customTheme.name}
                                onChange={(e) => setCustomTheme({...customTheme, name: e.target.value})}
                                className="bg-transparent border-b border-beatmap-border/20 focus:border-beatmap-primary outline-none text-sm px-2 py-1"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Fundo', key: 'bg' },
                                { label: 'Cartões', key: 'card' },
                                { label: 'Primária', key: 'primary' },
                                { label: 'Secundária', key: 'secondary' },
                                { label: 'Texto', key: 'text' },
                                { label: 'Texto Muted', key: 'muted' },
                                { label: 'Borda', key: 'border' },
                                { label: 'Destaque', key: 'accent' },
                            ].map((item) => (
                                <div key={item.key} className="space-y-1">
                                    <label className="text-xs text-beatmap-muted">{item.label}</label>
                                    <div className="flex items-center gap-2 bg-beatmap-card p-1.5 rounded-lg border border-beatmap-border/10">
                                        <input 
                                            type="color" 
                                            value={customTheme.colors[item.key as keyof Theme['colors']]}
                                            onChange={(e) => handleColorChange(item.key as keyof Theme['colors'], e.target.value)}
                                            className="w-6 h-6 rounded cursor-pointer border-none bg-transparent p-0"
                                        />
                                        <span className="text-xs font-mono opacity-70">{customTheme.colors[item.key as keyof Theme['colors']]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => {
                                    setIsEditing(false);
                                    handleThemeSelect(THEMES[0]); // Revert
                                }}
                                className="px-4 py-2 rounded-lg text-sm hover:bg-beatmap-border/10"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={saveCustomTheme}
                                className="px-4 py-2 rounded-lg text-sm bg-beatmap-primary text-white font-bold hover:opacity-90"
                            >
                                Salvar Tema
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* --- NOTIFICATIONS SECTION --- */}
        <div className="bg-beatmap-card rounded-2xl p-6 border border-beatmap-border/10">
           <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               <Bell className="text-beatmap-primary" size={20} /> Canais de Notificação
           </h2>
           
           <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-beatmap-bg/30 rounded-xl">
                   <div className="flex items-center gap-4">
                       <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                           <Bell size={24} />
                       </div>
                       <div>
                           <div className="font-semibold">Notificações Push</div>
                           <div className="text-xs text-beatmap-muted">Receba alertas no navegador/celular</div>
                       </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.pushNotifications} onChange={() => toggle('pushNotifications')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-beatmap-primary"></div>
                    </label>
               </div>

               <div className="flex items-center justify-between p-4 bg-beatmap-bg/30 rounded-xl">
                   <div className="flex items-center gap-4">
                       <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                           <Mail size={24} />
                       </div>
                       <div>
                           <div className="font-semibold">Email</div>
                           <div className="text-xs text-beatmap-muted">Receba resumos e alertas importantes</div>
                       </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.emailNotifications} onChange={() => toggle('emailNotifications')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-beatmap-primary"></div>
                    </label>
               </div>
           </div>
        </div>

        {/* --- TYPES SECTION --- */}
        <div className="bg-beatmap-card rounded-2xl p-6 border border-beatmap-border/10">
           <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               <Calendar className="text-beatmap-secondary" size={20} /> Tipos de Alerta
           </h2>
           
           <div className="space-y-4">
               <div className="flex items-center justify-between border-b border-beatmap-border/10 pb-4">
                   <div>
                       <div className="font-medium">Resumo Semanal</div>
                       <div className="text-xs text-beatmap-muted mt-1">Email toda segunda-feira com o que você perdeu.</div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.weeklySummary} onChange={() => toggle('weeklySummary')} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-beatmap-secondary"></div>
                    </label>
               </div>

               <div className="flex items-center justify-between pt-2">
                   <div>
                       <div className="font-medium">Novos Lançamentos</div>
                       <div className="text-xs text-beatmap-muted mt-1">Notificar imediatamente quando um artista que você segue lançar algo.</div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.notifyNewReleases} onChange={() => toggle('notifyNewReleases')} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-beatmap-secondary"></div>
                    </label>
               </div>
           </div>
        </div>
        
        <div className="flex justify-end">
            <button 
                onClick={handleSave}
                className="bg-beatmap-text text-beatmap-bg hover:opacity-90 px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg"
            >
                {saved ? <CheckCircle size={20} className="text-green-600" /> : <Save size={20} />}
                {saved ? 'Salvo!' : 'Salvar Alterações'}
            </button>
        </div>

      </div>
    </div>
  );
};