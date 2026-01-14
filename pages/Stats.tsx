import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Activity, Clock, Disc, Music2, UserCheck, TrendingUp, Bell, BellOff } from 'lucide-react';
import { TopArtistData, UserStats } from '../types';
import { getUserStatistics, toggleFollowArtist, getFollowedArtists } from '../lib/db';
import { fetchUserTopItems } from '../lib/spotify';

interface StatsProps {
  token: string | null;
  userId: string | null;
  supabaseUserId?: string;
}

const COLORS = ['#8b5cf6', '#ec4899', '#1DB954', '#3b82f6', '#f59e0b', '#ef4444'];

export const Stats: React.FC<StatsProps> = ({ token, supabaseUserId }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [topArtists, setTopArtists] = useState<TopArtistData[]>([]);
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        // 1. Fetch BeatMap usage stats from Supabase
        if (supabaseUserId) {
          const dbStats = await getUserStatistics(supabaseUserId);
          setStats(dbStats);
          
          const followed = await getFollowedArtists(supabaseUserId);
          setFollowedArtistIds(followed);
        } else {
            // Demo data
            setStats({
                totalPlaylists: 12,
                totalTracksSaved: 450,
                totalTimeMs: 86400000,
                uniqueArtists: 120,
                topGenres: [
                    { name: 'Pop', count: 40, percent: 40 },
                    { name: 'House', count: 30, percent: 30 },
                    { name: 'Rock', count: 20, percent: 20 },
                    { name: 'Indie', count: 10, percent: 10 }
                ],
                activityByMonth: [
                    { month: 'Jan', playlists: 1, tracks: 20 },
                    { month: 'Fev', playlists: 3, tracks: 80 },
                    { month: 'Mar', playlists: 2, tracks: 45 },
                    { month: 'Abr', playlists: 5, tracks: 120 }
                ]
            });
        }

        // 2. Fetch Spotify Top Data
        if (token) {
           const spotifyArtists = await fetchUserTopItems(token, 'artists', 'long_term', 10);
           setTopArtists(spotifyArtists.map((a: any) => ({
               id: a.id,
               name: a.name,
               image: a.images[0]?.url,
               popularity: a.popularity,
               genres: a.genres,
               external_url: a.external_urls.spotify
           })));
        } else {
             // Demo artists
             setTopArtists([
                 { id: '1', name: 'The Weeknd', image: 'https://images.unsplash.com/photo-1514525253440-b393452e3383?w=100', popularity: 98, genres: ['pop', 'r&b'], external_url: '#' },
                 { id: '2', name: 'Dua Lipa', image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=100', popularity: 95, genres: ['pop', 'dance'], external_url: '#' },
                 { id: '3', name: 'Arctic Monkeys', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100', popularity: 90, genres: ['rock', 'indie'], external_url: '#' }
             ]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [token, supabaseUserId]);

  const handleFollow = async (artist: TopArtistData) => {
      if (!supabaseUserId) return;
      
      const isNowFollowing = await toggleFollowArtist(supabaseUserId, artist.id, artist.name, artist.image);
      setFollowedArtistIds(prev => 
          isNowFollowing ? [...prev, artist.id] : prev.filter(id => id !== artist.id)
      );
      
      // Toast notification could go here, for now using console
      console.log(isNowFollowing ? `Following ${artist.name}` : `Unfollowed ${artist.name}`);
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours}h`;
  };

  if (loading) {
     return (
        <div className="flex justify-center items-center h-full min-h-[50vh]">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-beatmap-primary"></div>
        </div>
     );
  }

  return (
    <div className="space-y-8 pb-20">
       <div className="bg-gradient-to-r from-beatmap-primary/20 to-transparent p-8 rounded-3xl border border-white/5">
        <h1 className="text-3xl font-bold mb-2">Suas Estatísticas</h1>
        <p className="text-gray-300">Análise profunda do seu gosto musical e uso do BeatMap.</p>
      </div>

      {/* 1. Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-beatmap-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-beatmap-primary/50 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Disc size={64} />
              </div>
              <p className="text-gray-400 text-sm mb-1">Playlists Criadas</p>
              <h3 className="text-3xl font-bold">{stats?.totalPlaylists || 0}</h3>
          </div>
          <div className="bg-beatmap-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-beatmap-secondary/50 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Music2 size={64} />
              </div>
              <p className="text-gray-400 text-sm mb-1">Músicas Salvas</p>
              <h3 className="text-3xl font-bold">{stats?.totalTracksSaved || 0}</h3>
          </div>
          <div className="bg-beatmap-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-beatmap-accent/50 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Clock size={64} />
              </div>
              <p className="text-gray-400 text-sm mb-1">Tempo Mapeado</p>
              <h3 className="text-3xl font-bold">{formatTime(stats?.totalTimeMs || 0)}</h3>
          </div>
          <div className="bg-beatmap-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <UserCheck size={64} />
              </div>
              <p className="text-gray-400 text-sm mb-1">Artistas Únicos</p>
              <h3 className="text-3xl font-bold">{stats?.uniqueArtists || 0}</h3>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 2. Monthly Activity Chart */}
          <div className="bg-beatmap-card p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-6">
                  <Activity className="text-beatmap-primary" size={20} />
                  <h3 className="font-bold text-lg">Evolução de Descobertas</h3>
              </div>
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.activityByMonth || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#181818', borderColor: '#333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar dataKey="playlists" name="Playlists" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="tracks" name="Músicas" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* 3. Top Genres Chart */}
          <div className="bg-beatmap-card p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="text-beatmap-secondary" size={20} />
                  <h3 className="font-bold text-lg">Gêneros Mapeados</h3>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-center h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={stats?.topGenres || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="count"
                          >
                              {(stats?.topGenres || []).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                              ))}
                          </Pie>
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#181818', borderColor: '#333', borderRadius: '8px' }}
                             itemStyle={{ color: '#fff' }}
                          />
                          <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }}/>
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

      </div>

      {/* 4. Top Artists Rank */}
      <div className="bg-beatmap-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                  <UserCheck className="text-beatmap-accent" size={20} />
                  Seus Artistas Favoritos (Spotify)
              </h3>
              <span className="text-xs text-gray-400">Ative o sino para receber notificações de lançamentos</span>
          </div>
          <div className="divide-y divide-white/5">
              {topArtists.map((artist, index) => {
                  const isFollowing = followedArtistIds.includes(artist.id);
                  return (
                  <div key={artist.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                      <div className="text-2xl font-bold text-gray-600 w-8 text-center group-hover:text-beatmap-primary transition-colors">
                          #{index + 1}
                      </div>
                      <img src={artist.image} alt={artist.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                      <div className="flex-1">
                          <h4 className="font-bold">{artist.name}</h4>
                          <div className="flex gap-2 text-xs text-gray-400 mt-1">
                              {artist.genres.slice(0, 3).map(g => (
                                  <span key={g} className="bg-white/5 px-2 py-0.5 rounded-full">{g}</span>
                              ))}
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <button 
                             onClick={() => handleFollow(artist)}
                             className={`p-2 rounded-full transition-all ${isFollowing ? 'bg-beatmap-secondary text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                             title={isFollowing ? 'Parar de seguir notificações' : 'Receber notificações de lançamentos'}
                          >
                              {isFollowing ? <Bell size={18} fill="currentColor" /> : <BellOff size={18} />}
                          </button>
                          
                          <div className="text-right hidden sm:block">
                              <div className="text-xs text-gray-400">Popularidade</div>
                              <div className="font-mono text-beatmap-accent">{artist.popularity}%</div>
                          </div>
                          
                          <a 
                            href={artist.external_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white/10 hover:bg-white text-white hover:text-black px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                          >
                              Ver
                          </a>
                      </div>
                  </div>
              )})}
          </div>
      </div>

    </div>
  );
};