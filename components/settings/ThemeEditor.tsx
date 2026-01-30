import React, { useState, useEffect } from 'react';
import { Palette, Share2, Download, Plus, Trash2 } from 'lucide-react';
import { THEMES, applyTheme, getSavedTheme, saveTheme, exportTheme, importTheme } from '../../lib/theme';
import { Theme } from '../../types';
import { getCustomThemes, saveCustomTheme, deleteCustomTheme } from '../../lib/db';
import { supabase } from '../../lib/supabase';

export const ThemeEditorPanel: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [dbCustomThemes, setDbCustomThemes] = useState<Theme[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [customTheme, setCustomTheme] = useState<Theme>({
    id: 'custom',
    name: 'Meu Tema',
    colors: { ...THEMES[0].colors }
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initial Load from LocalStorage
    const saved = getSavedTheme();
    setCurrentTheme(saved);

    // 2. Get User ID and Load DB Themes
    supabase.auth.getSession().then((res: any) => {
        const session = res?.data?.session;
        if (session?.user) {
            setUserId(session.user.id);
            loadDbThemes(session.user.id);
        }
    });
  }, []);

  const loadDbThemes = async (uid: string) => {
      try {
          const themes = await getCustomThemes(uid);
          setDbCustomThemes(themes);
      } catch (e) {
          console.error("Error loading themes", e);
      }
  };

  const handleThemeSelect = (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    saveTheme(theme);
    if (!theme.isCustom) {
        setIsEditing(false);
    } else {
        setCustomTheme({ ...theme });
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

  const handleSaveCustomTheme = async () => {
      try {
          // Explicitly type newTheme as Theme to match saveCustomTheme return type
          let newTheme: Theme = { ...customTheme, isCustom: true };
          if (userId) {
              const saved = await saveCustomTheme(userId, newTheme);
              newTheme = saved;
              await loadDbThemes(userId);
          } else {
              newTheme.id = `custom-${Date.now()}`;
          }
          handleThemeSelect(newTheme);
          setIsEditing(false);
          alert('Tema salvo!');
      } catch (e) {
          console.error(e);
          alert('Erro ao salvar tema.');
      }
  };

  const handleDeleteTheme = async (themeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm('Tem certeza que deseja excluir este tema?')) {
          if (userId) {
              await deleteCustomTheme(userId, themeId);
              await loadDbThemes(userId);
          }
          if (currentTheme.id === themeId) {
              handleThemeSelect(THEMES[0]);
          }
      }
  };

  const handleShareTheme = () => {
      const code = exportTheme(currentTheme);
      navigator.clipboard.writeText(code);
      alert('Código copiado!');
  };

  const handleImportTheme = () => {
      const code = prompt('Cole o código do tema aqui:');
      if (code) {
          const imported = importTheme(code);
          if (imported) {
              setCustomTheme(imported);
              handleThemeSelect(imported);
              alert('Tema importado!');
          } else {
              alert('Código inválido.');
          }
      }
  };

  return (
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

            {dbCustomThemes.map(theme => (
                    <div key={theme.id} className="relative group">
                    <button
                        onClick={() => handleThemeSelect(theme)}
                        className={`w-full p-1 rounded-xl transition-all ${currentTheme.id === theme.id ? 'ring-2 ring-beatmap-primary ring-offset-2 ring-offset-beatmap-bg' : 'hover:ring-1 hover:ring-beatmap-muted'}`}
                    >
                        <div className="h-20 rounded-lg overflow-hidden border border-beatmap-border/10 relative" style={{ background: theme.colors.bg }}>
                            <div className="absolute top-2 left-2 w-12 h-8 rounded" style={{ background: theme.colors.card }}></div>
                            <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full" style={{ background: theme.colors.primary }}></div>
                            <div className="absolute bottom-1 left-1 text-beatmap-text/50">
                                    <Download size={10} />
                            </div>
                        </div>
                        <div className="text-center mt-2 text-xs font-medium truncate">{theme.name}</div>
                    </button>
                    <button 
                        onClick={(e) => handleDeleteTheme(theme.id, e)}
                        className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Excluir Tema"
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
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
                                handleThemeSelect(THEMES[0]);
                            }}
                            className="px-4 py-2 rounded-lg text-sm hover:bg-beatmap-border/10"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSaveCustomTheme}
                            className="px-4 py-2 rounded-lg text-sm bg-beatmap-primary text-white font-bold hover:opacity-90"
                        >
                            Salvar Tema
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
