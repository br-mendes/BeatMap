 'use client'

import React from 'react';
import { Disc, History, LayoutDashboard, BarChart2, Settings, Sparkles, LogOut } from 'lucide-react';
import { Navbar } from './Navbar';
import { User } from '../types';
import { useLayout } from '../contexts/LayoutContext';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  const { settings } = useLayout();
  
  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        activeTab === id 
          ? 'bg-gradient-to-r from-beatmap-primary/20 to-transparent text-beatmap-text border-l-4 border-beatmap-primary' 
          : 'text-beatmap-muted hover:text-beatmap-text hover:bg-beatmap-text/5'
      }`}
    >
      <Icon size={20} className={activeTab === id ? 'text-beatmap-primary' : 'group-hover:text-beatmap-text'} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const containerClasses = `min-h-screen bg-beatmap-dark text-beatmap-text flex flex-col transition-colors duration-300 ${
      settings.sidebarPosition === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'
  }`;

  const showSidebar = settings.sidebarPosition !== 'hidden';

  return (
    <div className={containerClasses}>
      {/* Sidebar - Desktop */}
      {showSidebar && (
          <aside className="hidden md:flex flex-col w-64 border-x border-beatmap-border/10 h-screen sticky top-0 bg-beatmap-card/30 backdrop-blur-sm z-40">
            <div className="p-6">
            <span className="text-xs font-bold text-beatmap-muted uppercase tracking-wider">Menu Principal</span>
            </div>
            <div className="flex-1 px-3 space-y-1">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Descobrir" />
            <NavItem id="discovery" icon={Sparkles} label="Para Você" />
            <NavItem id="stats" icon={BarChart2} label="Estatísticas" />
            <NavItem id="history" icon={History} label="Histórico" />
            <NavItem id="playlists" icon={Disc} label="Minhas Playlists" />
            </div>
            
            <div className="px-3 pb-4">
                <div className="h-px bg-beatmap-border/10 mb-4 mx-2"></div>
                <NavItem id="settings" icon={Settings} label="Configurações" />
                
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-beatmap-muted hover:text-red-400 hover:bg-red-500/10 group mt-1"
                >
                  <LogOut size={20} className="group-hover:text-red-400" />
                  <span className="font-medium">Sair</span>
                </button>
            </div>
            
            <div className="p-4 border-t border-beatmap-border/10">
            <div className="bg-gradient-to-br from-beatmap-primary/20 to-beatmap-secondary/20 p-4 rounded-xl border border-beatmap-border/5">
                <h4 className="font-bold text-sm mb-1 text-beatmap-text">BeatMap Pro</h4>
                <p className="text-xs text-beatmap-muted mb-3">Sincronização automática em breve.</p>
            </div>
            </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar user={user} onLogout={onLogout} />
        
        <main className={`flex-1 overflow-y-auto ${
            settings.density === 'compact' ? 'p-2 md:p-4' : 
            settings.density === 'expanded' ? 'p-6 md:p-12' : 
            'p-4 md:p-8'
        }`}>
          {children}
        </main>

        {/* Mobile Bottom Nav - Show on mobile OR if sidebar is hidden on desktop */}
        <div className={`fixed bottom-0 left-0 right-0 bg-beatmap-card border-t border-beatmap-border/10 px-4 py-2 flex justify-around z-50 pb-safe ${
            showSidebar ? 'md:hidden' : 'flex'
        }`}>
            <button onClick={() => setActiveTab('dashboard')} className={`p-2 flex flex-col items-center ${activeTab === 'dashboard' ? 'text-beatmap-primary' : 'text-beatmap-muted'}`}>
              <LayoutDashboard size={20} />
            </button>
             <button onClick={() => setActiveTab('discovery')} className={`p-2 flex flex-col items-center ${activeTab === 'discovery' ? 'text-beatmap-primary' : 'text-beatmap-muted'}`}>
              <Sparkles size={20} />
            </button>
            <button onClick={() => setActiveTab('stats')} className={`p-2 flex flex-col items-center ${activeTab === 'stats' ? 'text-beatmap-primary' : 'text-beatmap-muted'}`}>
              <BarChart2 size={20} />
            </button>
            <button onClick={() => setActiveTab('history')} className={`p-2 flex flex-col items-center ${activeTab === 'history' ? 'text-beatmap-primary' : 'text-beatmap-muted'}`}>
              <History size={20} />
            </button>
             <button onClick={() => setActiveTab('settings')} className={`p-2 flex flex-col items-center ${activeTab === 'settings' ? 'text-beatmap-primary' : 'text-beatmap-muted'}`}>
              <Settings size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};
