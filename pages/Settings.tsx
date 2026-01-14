import React, { useState } from 'react';
import { Bell, Mail, Calendar, Save, CheckCircle } from 'lucide-react';

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
    // In a real app, save to Supabase DB
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="bg-gradient-to-r from-gray-800 to-transparent p-8 rounded-3xl border border-white/5">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-gray-300">Gerencie suas preferências de notificação e alertas.</p>
      </div>

      <div className="grid gap-6">
        
        {/* Section: Channels */}
        <div className="bg-beatmap-card rounded-2xl p-6 border border-white/5">
           <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               <Bell className="text-beatmap-primary" size={20} /> Canais de Notificação
           </h2>
           
           <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                   <div className="flex items-center gap-4">
                       <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                           <Bell size={24} />
                       </div>
                       <div>
                           <div className="font-semibold">Notificações Push</div>
                           <div className="text-xs text-gray-400">Receba alertas no navegador/celular</div>
                       </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.pushNotifications} onChange={() => toggle('pushNotifications')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-beatmap-primary"></div>
                    </label>
               </div>

               <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                   <div className="flex items-center gap-4">
                       <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                           <Mail size={24} />
                       </div>
                       <div>
                           <div className="font-semibold">Email</div>
                           <div className="text-xs text-gray-400">Receba resumos e alertas importantes</div>
                       </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.emailNotifications} onChange={() => toggle('emailNotifications')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-beatmap-primary"></div>
                    </label>
               </div>
           </div>
        </div>

        {/* Section: Frequency & Types */}
        <div className="bg-beatmap-card rounded-2xl p-6 border border-white/5">
           <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               <Calendar className="text-beatmap-secondary" size={20} /> Tipos de Alerta
           </h2>
           
           <div className="space-y-4">
               <div className="flex items-center justify-between border-b border-white/5 pb-4">
                   <div>
                       <div className="font-medium text-white">Resumo Semanal</div>
                       <div className="text-xs text-gray-400 mt-1">Email toda segunda-feira com o que você perdeu.</div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.weeklySummary} onChange={() => toggle('weeklySummary')} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-beatmap-secondary"></div>
                    </label>
               </div>

               <div className="flex items-center justify-between pt-2">
                   <div>
                       <div className="font-medium text-white">Novos Lançamentos (Artistas Seguidos)</div>
                       <div className="text-xs text-gray-400 mt-1">Notificar imediatamente quando um artista que você segue lançar algo.</div>
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
                className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95"
            >
                {saved ? <CheckCircle size={20} className="text-green-600" /> : <Save size={20} />}
                {saved ? 'Salvo!' : 'Salvar Alterações'}
            </button>
        </div>

      </div>
    </div>
  );
};