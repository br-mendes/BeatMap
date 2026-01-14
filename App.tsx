import React, { useState, useEffect } from 'react';
import { supabase, spotifyConfig } from './lib/supabase';
import { fetchUserProfile } from './lib/spotify';
import { getUserHistory, deletePlaylist } from './lib/db';
import { User, HistoryItem } from './types';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';
import { Discovery } from './pages/Discovery';

function App() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState('login'); // 'login' | 'dashboard' | 'history' | 'playlists' | 'stats'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Check for OAuth errors in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    
    const error = params.get('error') || hashParams.get('error');
    const errorCode = params.get('error_code') || hashParams.get('error_code');
    const errorDescription = params.get('error_description') || hashParams.get('error_description');

    if (error) {
      // Clear the URL to avoid user seeing the ugly parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      if (errorCode === 'provider_email_needs_verification') {
        setLoginError(
          "Verificação Necessária: O Supabase enviou um email de confirmação para o endereço da sua conta Spotify. " +
          "Por favor, verifique sua caixa de entrada (e spam) e clique no link para ativar seu acesso. " +
          "Depois de confirmar, tente entrar novamente."
        );
      } else {
        const decodedDesc = errorDescription ? decodeURIComponent(errorDescription).replace(/\+/g, ' ') : error;
        setLoginError(`Erro no login: ${decodedDesc}`);
      }
    }
  }, []);

  // Initialize Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setToken(session.provider_token || null);
        setView('dashboard');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setToken(session.provider_token || null);
        setView('dashboard');
        setLoginError(null); // Clear errors on success
      } else if (!isDemo) {
        setView('login');
      }
    });

    return () => subscription.unsubscribe();
  }, [isDemo]);

  // Load User Profile and History
  useEffect(() => {
    if (token && session?.user?.id) {
      fetchUserProfile(token).then(profile => setUser(profile));
      loadHistory(session.user.id);
    } else if (isDemo) {
      // Mock user for demo
      setUser({
        id: 'demo-user',
        display_name: 'Usuário Convidado',
        email: 'demo@beatmap.com',
        product: 'free',
        images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80' }]
      });
      // Mock history for demo
      setHistory([{
        id: 'demo-1',
        playlistName: 'Demo Playlist',
        trackCount: 15,
        createdAt: new Date().toISOString(),
        spotifyUrl: '#'
      }]);
    }
  }, [token, isDemo, session]);

  const loadHistory = async (userId: string) => {
    const data = await getUserHistory(userId);
    setHistory(data);
  };

  const handleLogin = async () => {
    setLoginError(null);
    // Uses the scopes from the configuration
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        scopes: spotifyConfig.scopes.join(' '),
        // Redirect to the current URL after auth
        redirectTo: window.location.origin, 
      },
    });
    if (error) {
      console.error('Erro no login:', error.message);
      setLoginError('Erro ao iniciar conexão com Spotify: ' + error.message);
    }
  };

  const handleDemo = () => {
    setIsDemo(true);
    setLoginError(null);
    setToken('mock-token'); // Triggers mock data in spotify.ts
    setView('dashboard');
  };

  const handleLogout = async () => {
    if (!isDemo) {
      await supabase.auth.signOut();
    }
    setIsDemo(false);
    setUser(null);
    setToken(null);
    setView('login');
  };

  const handleRefreshHistory = () => {
    if (session?.user?.id) {
      loadHistory(session.user.id);
    } else if (isDemo) {
      // Add fake item for demo feel
      setHistory(prev => [{
        id: Math.random().toString(),
        playlistName: 'Nova Playlist Demo',
        trackCount: 10,
        createdAt: new Date().toISOString(),
        spotifyUrl: '#'
      }, ...prev]);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (isDemo) {
      setHistory(prev => prev.filter(item => item.id !== id));
      return;
    }

    if (window.confirm('Tem certeza que deseja remover este item do histórico? Isso não apaga a playlist da sua conta Spotify.')) {
      try {
        await deletePlaylist(id);
        if (session?.user?.id) {
          loadHistory(session.user.id);
        }
      } catch (e) {
        alert('Erro ao excluir item.');
      }
    }
  };

  if (view === 'login') {
    return <Login onLogin={handleLogin} onDemo={handleDemo} error={loginError} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {activeTab === 'dashboard' && (
        <Dashboard 
          token={token} 
          userId={user?.id || null} 
          supabaseUserId={session?.user?.id}
          onPlaylistCreated={handleRefreshHistory}
        />
      )}
      
      {activeTab === 'discovery' && (
        <Discovery 
          token={token}
          userId={user?.id || null}
          supabaseUserId={session?.user?.id}
        />
      )}
      
      {activeTab === 'stats' && (
        <Stats 
            token={token}
            userId={user?.id || null}
            supabaseUserId={session?.user?.id}
        />
      )}

      {activeTab === 'history' && (
        <History items={history} onDelete={handleDeletePlaylist} />
      )}
      
      {activeTab === 'settings' && (
        <Settings />
      )}

      {activeTab === 'playlists' && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="bg-white/5 p-6 rounded-full">
                <svg className="w-12 h-12 text-beatmap-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold">Minhas Playlists</h2>
            <p className="text-gray-400 max-w-md">
                Gerencie suas playlists importadas e sincronize com sua biblioteca. Esta funcionalidade estará disponível na versão Pro.
            </p>
        </div>
      )}
    </Layout>
  );
}

export default App;