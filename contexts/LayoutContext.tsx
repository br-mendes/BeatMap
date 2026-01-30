import React, { createContext, useContext, useState, useEffect } from 'react';
import { LayoutSettings, LayoutMode, AppFontSize, AppDensity, SidebarPosition } from '../types';
import { supabase } from '../lib/supabase';
import { saveUserPreferences, getUserPreferences } from '../lib/db';

interface LayoutContextType {
  settings: LayoutSettings;
  updateSettings: (newSettings: Partial<LayoutSettings>) => void;
  resetLayout: () => void;
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  presets: string[];
}

const DEFAULT_SETTINGS: LayoutSettings = {
  mode: 'grid-normal',
  fontSize: 'normal',
  density: 'normal',
  sidebarPosition: 'left'
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<LayoutSettings>(DEFAULT_SETTINGS);
  const [presets, setPresets] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Load from LocalStorage (Fast First Paint)
    const saved = localStorage.getItem('beatmap_layout');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse layout settings");
      }
    }
    
    // 2. Load presets
    const savedPresets = localStorage.getItem('beatmap_layout_presets');
    if (savedPresets) {
        setPresets(JSON.parse(savedPresets).map((p: any) => p.name));
    }

    // 3. Listen for Auth to Sync DB
    supabase.auth.getSession().then((res: any) => {
        const session = res?.data?.session;
        if (session?.user) {
            setUserId(session.user.id);
            fetchRemoteSettings(session.user.id);
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            setUserId(session.user.id);
            fetchRemoteSettings(session.user.id);
        } else {
            setUserId(null);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRemoteSettings = async (uid: string) => {
      try {
          const prefs = await getUserPreferences(uid);
          if (prefs?.layout_settings) {
              setSettings(prefs.layout_settings);
              localStorage.setItem('beatmap_layout', JSON.stringify(prefs.layout_settings));
          }
      } catch (e) {
          console.error(e);
      }
  };

  useEffect(() => {
    // Apply Font Size to Root
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (settings.fontSize === 'small') root.classList.add('text-sm');
    if (settings.fontSize === 'normal') root.classList.add('text-base');
    if (settings.fontSize === 'large') root.classList.add('text-lg');

    // Save to DB (Debounced ideal, but here direct)
    if (userId) {
        saveUserPreferences(userId, { layout_settings: settings });
    }
    // Save to Local
    localStorage.setItem('beatmap_layout', JSON.stringify(settings));

  }, [settings, userId]);

  const updateSettings = (newSettings: Partial<LayoutSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetLayout = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const savePreset = (name: string) => {
      const saved = localStorage.getItem('beatmap_layout_presets');
      let currentPresets = saved ? JSON.parse(saved) : [];
      
      // Remove existing with same name to overwrite
      currentPresets = currentPresets.filter((p: any) => p.name !== name);
      
      currentPresets.push({ name, settings });
      localStorage.setItem('beatmap_layout_presets', JSON.stringify(currentPresets));
      setPresets(currentPresets.map((p: any) => p.name));
  };

  const loadPreset = (name: string) => {
      const saved = localStorage.getItem('beatmap_layout_presets');
      if (saved) {
          const currentPresets = JSON.parse(saved);
          const preset = currentPresets.find((p: any) => p.name === name);
          if (preset) {
              setSettings(preset.settings);
          }
      }
  };

  return (
    <LayoutContext.Provider value={{ settings, updateSettings, resetLayout, savePreset, loadPreset, presets }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
