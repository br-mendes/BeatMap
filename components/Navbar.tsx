import React from 'react';
import { User } from '../types';
import { BeatMapLogo } from './BeatMapLogo';
import { LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="h-16 border-b border-white/10 bg-beatmap-dark/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
      <BeatMapLogo size="sm" />
      
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-white">{user.display_name}</span>
              <span className="text-xs text-gray-400 capitalize">{user.product} Plan</span>
            </div>
            {user.images?.[0] ? (
              <img 
                src={user.images[0].url} 
                alt="Profile" 
                className="w-9 h-9 rounded-full border-2 border-beatmap-primary"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center border-2 border-beatmap-primary">
                <UserIcon size={18} />
              </div>
            )}
            <button 
              onClick={onLogout}
              className="ml-2 p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
        )}
      </div>
    </nav>
  );
};