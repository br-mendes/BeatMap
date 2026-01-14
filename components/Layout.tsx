import React from 'react';
import { Disc, History, LayoutDashboard, BarChart2, Settings, Sparkles } from 'lucide-react';
import { Navbar } from './Navbar';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  
  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        activeTab === id 
          ? 'bg-gradient-to-r from-beatmap-primary/20 to-transparent text-white border-l-4 border-beatmap-primary' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={20} className={activeTab === id ? 'text-beatmap-primary' : 'group-hover:text-white'} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-beatmap-dark text-white flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 h-screen sticky top-0 bg-beatmap-card/30">
        <div className="p-6">
           <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Menu Principal</span>
        </div>
        <div className="flex-1 px-3 space-y-1">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Descobrir" />
          <NavItem id="discovery" icon={Sparkles} label="Para Você" />
          <NavItem id="stats" icon={BarChart2} label="Estatísticas" />
          <NavItem id="history" icon={History} label="Histórico" />
          <NavItem id="playlists" icon={Disc} label="Minhas Playlists" />
        </div>
        
        <div className="px-3 pb-4">
             <div className="h-px bg-white/10 mb-4 mx-2"></div>
             <NavItem id="settings" icon={Settings} label="Configurações" />
        </div>
        
        <div className="p-4 border-t border-white/10">
           <div className="bg-gradient-to-br from-beatmap-primary/20 to-beatmap-secondary/20 p-4 rounded-xl border border-white/5">
             <h4 className="font-bold text-sm mb-1">BeatMap Pro</h4>
             <p className="text-xs text-gray-400 mb-3">Sincronização automática em breve.</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar user={user} onLogout={onLogout} />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-beatmap-card border-t border-white/10 px-4 py-2 flex justify-around z-50 pb-safe">
            <button onClick={() => setActiveTab('dashboard')} className={`p-2 flex flex-col items-center ${activeTab === 'dashboard' ? 'text-beatmap-primary' : 'text-gray-400'}`}>
              <LayoutDashboard size={20} />
            </button>
             <button onClick={() => setActiveTab('discovery')} className={`p-2 flex flex-col items-center ${activeTab === 'discovery' ? 'text-beatmap-primary' : 'text-gray-400'}`}>
              <Sparkles size={20} />
            </button>
            <button onClick={() => setActiveTab('stats')} className={`p-2 flex flex-col items-center ${activeTab === 'stats' ? 'text-beatmap-primary' : 'text-gray-400'}`}>
              <BarChart2 size={20} />
            </button>
            <button onClick={() => setActiveTab('history')} className={`p-2 flex flex-col items-center ${activeTab === 'history' ? 'text-beatmap-primary' : 'text-gray-400'}`}>
              <History size={20} />
            </button>
             <button onClick={() => setActiveTab('playlists')} className={`p-2 flex flex-col items-center ${activeTab === 'playlists' ? 'text-beatmap-primary' : 'text-gray-400'}`}>
              <Disc size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};