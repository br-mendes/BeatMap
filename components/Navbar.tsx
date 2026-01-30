 'use client'

import React from 'react';
import { User } from '../types';
import { BeatMapLogo } from './BeatMapLogo';
import { LogOut, User as UserIcon } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="h-16 border-b border-beatmap-border/10 bg-beatmap-dark/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between transition-colors duration-300">
      <BeatMapLogo size="sm" />
      
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
             {/* Notification Center */}
            <NotificationCenter userId={user.id} />
            <div className="h-6 w-px bg-beatmap-border/10 mx-1"></div>

            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-beatmap-text">{user.display_name}</span>
              <span className="text-xs text-beatmap-muted capitalize">{user.product} Plan</span>
            </div>
            {user.images?.[0] ? (
              <img 
                src={user.images[0].url} 
                alt="Profile" 
                className="w-9 h-9 rounded-full border-2 border-beatmap-primary"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-beatmap-card flex items-center justify-center border-2 border-beatmap-primary text-beatmap-muted">
                <UserIcon size={18} />
              </div>
            )}
            <button 
              onClick={onLogout}
              className="ml-2 p-2 hover:bg-beatmap-text/10 rounded-full transition-colors text-beatmap-muted hover:text-beatmap-text"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-beatmap-card animate-pulse"></div>
        )}
      </div>
    </nav>
  );
};
