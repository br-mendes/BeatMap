import React from 'react';
import { BeatMapLogo } from '../components/BeatMapLogo';

interface LoginProps {
  onLogin: () => void;
  onDemo: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onDemo }) => {
  return (
    <div className="min-h-screen bg-beatmap-dark flex items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-beatmap-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-beatmap-secondary/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-md w-full px-6 text-center">
        <div className="flex justify-center mb-8">
          <BeatMapLogo size="xl" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Mapeando o som <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-beatmap-primary to-beatmap-secondary">
            do seu mundo.
          </span>
        </h2>
        
        <p className="text-gray-400 mb-10 text-lg">
          Descubra lançamentos diários, filtre por seus gêneros favoritos e exporte playlists diretamente para sua conta.
        </p>

        <div className="space-y-4">
          <button 
            onClick={onLogin}
            className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-4 px-6 rounded-full transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(29,185,84,0.3)]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Entrar com Spotify
          </button>
          
          <button 
            onClick={onDemo}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-full transition-all border border-white/5 backdrop-blur-md"
          >
            Modo Demonstração
          </button>
        </div>

        <p className="mt-8 text-xs text-gray-500">
          Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade.
        </p>
      </div>
    </div>
  );
};