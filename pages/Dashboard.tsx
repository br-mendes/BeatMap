import React, { useState, useEffect } from 'react';
import { Filter, Calendar, Music, Plus, ExternalLink, Check, RefreshCw } from 'lucide-react';
import { Album, FilterState } from '../types';
import { fetchNewReleases, createPlaylist, addTracksToPlaylist, getAlbums, searchByGenre } from '../lib/spotify';
import { savePlaylistToDb } from '../lib/db';

interface DashboardProps {
  token: string | null;
  userId: string | null; // Spotify User ID
  supabaseUserId?: string; // Supabase User ID for DB
  onPlaylistCreated: () => void;
}

const COMMON_GENRES = [
  'Pop', 'Rock', 'Hip Hop', 'Eletrônica', 'Funk', 'Sertanejo', 'MPB', 'Indie', 'Jazz', 'Metal'
];

export const Dashboard: React.FC<DashboardProps> = ({ token, userId, supabaseUserId, onPlaylistCreated }) => {
  const [releases, setReleases] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState & { genre: string }>({
    search: '',
    type: 'all',
    dateRange: 'week',
    genre: ''
  });
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const loadReleases = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let data: Album[] = [];
      
      if (filters.genre && filters.genre !== '') {
        // If genre is selected, search by genre
        data = await searchByGenre(token, filters.genre);
      } else {
        // Otherwise, fetch new releases
        data = await fetchNewReleases(token);
      }
      
      setReleases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReleases();
  }, [token, filters.genre]);

  const filteredReleases = releases.filter(album => {
    const matchesSearch = album.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          album.artists.some(a => a.name.toLowerCase().includes(filters.search.toLowerCase()));
    
    // API search handles genre, but we keep type filter client-side for the results
    const matchesType = filters.type === 'all' || album.album_type === filters.type;
    
    return matchesSearch && matchesType;
  });

  const toggleSelection = (id: string) => {
    setSelectedAlbums(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreatePlaylist = async () => {
    if (!token || !userId || selectedAlbums.length === 0) return;
    setIsCreating(true);

    try {
      // 1. Fetch full details for selected albums (to get tracks)
      const fullAlbums = await getAlbums(token, selectedAlbums);
      
      // 2. Extract track URIs
      const trackUris: string[] = [];
      fullAlbums.forEach(album => {
        if (album.tracks?.items) {
          album.tracks.items.forEach(track => {
            trackUris.push(track.uri);
          });
        }
      });

      if (trackUris.length === 0 && !token.startsWith('mock')) {
        alert('Não foi possível encontrar faixas nos álbuns selecionados.');
        setIsCreating(false);
        return;
      }

      // 3. Create Spotify Playlist
      const playlistName = `BeatMap Mix ${new Date().toLocaleDateString('pt-BR')}`;
      const description = filters.genre 
        ? `Mix de ${filters.genre} gerado pelo BeatMap.`
        : 'Novidades selecionadas via BeatMap - Mapeando o som do seu mundo.';
        
      const playlist = await createPlaylist(token, userId, playlistName, description);

      // 4. Add tracks to Spotify Playlist
      await addTracksToPlaylist(token, playlist.id, trackUris);

      // 5. Save to BeatMap Database (if authenticated in Supabase)
      if (supabaseUserId) {
        await savePlaylistToDb(supabaseUserId, playlistName, playlist.id, fullAlbums, filters.genre);
      }

      onPlaylistCreated();
      setSelectedAlbums([]);
      alert('Playlist criada com sucesso no seu Spotify!');

    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao criar a playlist.');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading && releases.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-beatmap-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center bg-gradient-to-r from-beatmap-card to-transparent p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {filters.genre ? `Explorar: ${filters.genre}` : 'Novidades da Semana'}
          </h1>
          <p className="text-gray-400">
            {filters.genre 
              ? `Álbuns recentes do gênero ${filters.genre}`
              : 'Explore os lançamentos mais recentes mapeados para você.'}
          </p>
        </div>
        
        <div className="flex flex-col gap-4 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative group flex-1">
              <input 
                type="text" 
                placeholder="Filtrar artista ou álbum..." 
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="bg-black/30 border border-white/10 rounded-full py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-beatmap-primary w-full transition-all"
              />
              <Filter className="absolute right-3 top-2.5 text-gray-500 w-4 h-4" />
            </div>

             <div className="relative">
              <select 
                value={filters.genre}
                onChange={(e) => setFilters({...filters, genre: e.target.value})}
                className="bg-black/30 border border-white/10 rounded-full py-2.5 px-4 text-sm focus:outline-none focus:border-beatmap-primary appearance-none cursor-pointer w-full sm:w-auto"
              >
                <option value="">Gênero: Todos</option>
                {COMMON_GENRES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            
            <select 
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value as any})}
              className="bg-black/30 border border-white/10 rounded-full py-2.5 px-4 text-sm focus:outline-none focus:border-beatmap-primary appearance-none cursor-pointer w-full sm:w-auto"
            >
              <option value="all">Tipo: Todos</option>
              <option value="album">Álbuns</option>
              <option value="single">Singles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
           <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-beatmap-primary"></div>
        </div>
      ) : filteredReleases.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>Nenhum lançamento encontrado para os filtros selecionados.</p>
          <button 
            onClick={() => setFilters({ search: '', type: 'all', dateRange: 'week', genre: '' })}
            className="mt-4 text-beatmap-primary hover:text-white flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} /> Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredReleases.map(album => {
            const isSelected = selectedAlbums.includes(album.id);
            return (
              <div 
                key={album.id} 
                onClick={() => toggleSelection(album.id)}
                className={`group relative bg-beatmap-card rounded-xl p-4 transition-all duration-300 hover:bg-white/5 cursor-pointer border ${isSelected ? 'border-beatmap-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'border-transparent hover:border-white/10'}`}
              >
                <div className="relative aspect-square mb-4 rounded-lg overflow-hidden shadow-lg">
                  <img 
                    src={album.images[0]?.url} 
                    alt={album.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay Icon */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                     <div className={`rounded-full p-2 ${isSelected ? 'bg-beatmap-primary text-white' : 'bg-white text-black'}`}>
                        {isSelected ? <Check size={20} /> : <Plus size={20} />}
                     </div>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                    {album.album_type}
                  </div>
                </div>

                <h3 className="font-semibold text-white truncate mb-1" title={album.name}>{album.name}</h3>
                <p className="text-sm text-gray-400 truncate">{album.artists.map(a => a.name).join(', ')}</p>
                
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(album.release_date).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Music size={12} />
                    {album.total_tracks}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedAlbums.length > 0 && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 bg-beatmap-card border border-white/10 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 z-50 animate-float">
          <span className="text-sm font-medium">
            <span className="text-beatmap-primary font-bold">{selectedAlbums.length}</span> releases selecionados
          </span>
          <div className="h-6 w-px bg-white/20"></div>
          <button 
            onClick={handleCreatePlaylist}
            disabled={isCreating}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Criando...' : 'Gerar Playlist'}
            <ExternalLink size={16} />
          </button>
        </div>
      )}
    </div>
  );
};