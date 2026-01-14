import React, { createContext, useContext, useState, useEffect } from 'react';
import { LayoutSettings, LayoutMode, AppFontSize, AppDensity, SidebarPosition } from '../types';

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

  useEffect(() => {
    const saved = localStorage.getItem('beatmap_layout');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse layout settings");
      }
    }
    
    // Load presets list
    const savedPresets = localStorage.getItem('beatmap_layout_presets');
    if (savedPresets) {
        setPresets(JSON.parse(savedPresets).map((p: any) => p.name));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('beatmap_layout', JSON.stringify(settings));
    
    // Apply Font Size to Root
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (settings.fontSize === 'small') root.classList.add('text-sm');
    if (settings.fontSize === 'normal') root.classList.add('text-base');
    if (settings.fontSize === 'large') root.classList.add('text-lg');

  }, [settings]);

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