import React, { useState } from 'react';
import { Bell, Mail, Save, CheckCircle } from 'lucide-react';
import { LayoutSettingsPanel } from '../components/settings/LayoutSettings';
import { ThemeEditorPanel } from '../components/settings/ThemeEditor';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklySummary: true,
    notifyNewReleases: true
  });
  
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="bg-gradient-to-r from-beatmap-card to-transparent p-8 rounded-3xl border border-beatmap-border/10">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-beatmap-muted">Personalize sua experiência no BeatMap.</p>
      </div>

      <div className="grid gap-8">
        
        <LayoutSettingsPanel />
        <ThemeEditorPanel />

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
        
        <div className="flex justify-end sticky bottom-6 z-20">
            <button 
                onClick={handleSave}
                className={`
                    px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all duration-300 border
                    ${saved 
                        ? 'bg-green-500 text-white border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-105' 
                        : 'bg-beatmap-primary text-white border-beatmap-primary shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-105 active:scale-95'
                    }
                `}
            >
                {saved ? <CheckCircle size={20} className="text-white" /> : <Save size={20} />}
                {saved ? 'Salvo com sucesso!' : 'Salvar Alterações'}
            </button>
        </div>

      </div>
    </div>
  );
};