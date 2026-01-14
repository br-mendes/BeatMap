import React, { useState, useEffect, useRef } from 'react';
import { 
    Filter, Calendar, Music, Plus, ExternalLink, Check, RefreshCw, 
    Disc, Mic2, Grid, List as ListIcon, Play, Pause, AlertCircle 
} from 'lucide-react';
import { Album, FilterState, Track, DateRangeType } from '../types';
import { 
    fetchNewReleases, createPlaylist, addTracksToPlaylist, getAlbums, 
    searchByGenre, searchNewTracks, isDateInInterval 
} from '../lib/spotify';
import { savePlaylistToDb } from '../lib/db';

interface DashboardProps {
  token: string | null;
  userId: string | null;
  supabaseUserId?: string;
  onPlaylistCreated: () => void;
}

const COMMON_GENRES = [
  'Pop', 'Rock', 'Hip Hop', 'Eletrônica', 'Funk', 'Sertanejo', 'MPB', 'Indie', 'Jazz', 'Metal', 'R&B'
];

export const Dashboard: React.FC<DashboardProps> = ({ token, userId, supabaseUserId, onPlaylistCreated }) => {
  // --- STATE ---
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateRange: 'week',
    customStartDate: '',
    customEndDate: '',
    genre: '',
    contentType: 'albums', // 'albums' or 'tracks'
    viewMode: 'grid'       // 'grid' or 'list'
  });

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Audio Preview State
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- DATA LOADING ---

  const loadData = async (isLoadMore = false) => {
    if (!token) return;
    
    if (!isLoadMore) {
        setLoading(true);
        setOffset(0);
    } else {
        setLoadingMore(true);
    }

    try {
      const currentOffset = isLoadMore ? offset + 50 : 0;
      let newItems: any[] = [];

      if (filters.contentType === 'albums') {
          if (filters.genre) {
              newItems = await searchByGenre(token, filters.genre, 'album', 50);
          } else {
              newItems = await fetchNewReleases(token, 50, currentOffset);
          }
          
          if (isLoadMore) {
              setAlbums(prev => [...prev, ...newItems]);
              setOffset(prev => prev + 50);
          } else {
              setAlbums(newItems);
              setOffset(50);
          }
      } else {
          // Tracks
          if (filters.genre) {
              newItems = await searchByGenre(token, filters.genre, 'track', 50);
          } else {
              newItems = await searchNewTracks(token, '', 50, currentOffset);
          }

          if (isLoadMore) {
              setTracks(prev => [...prev, ...newItems]);
              setOffset(prev => prev + 50);
          } else {
              setTracks(newItems);
              setOffset(50);
          }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // Reset selections when switching content type
    setSelectedItems([]);
    setPlayingPreview(null);
    if(audioRef.current) {
        audioRef.current.pause();
    }
    loadData(false);
  }, [token, filters.contentType, filters.genre]);

  // --- FILTERING ---

  const getFilteredItems = () => {
    const items = filters.contentType === 'albums' ? albums : tracks;
    
    return items.filter(item => {
      const searchLower = filters.search.toLowerCase();
      // Safe check for artists existence
      const artistMatch = item.artists?.some(a => a.name.toLowerCase().includes(searchLower)) || false;
      const nameMatch = item.name.toLowerCase().includes(searchLower);
      
      const dateString = filters.contentType === 'albums' 
          ? (item as Album).release_date 
          : (item as Track).album?.release_date || '';

      const dateMatch = isDateInInterval(
          dateString, 
          filters.dateRange, 
          filters.customStartDate, 
          filters.customEndDate
      );

      return (nameMatch || artistMatch) && dateMatch;
    });
  };

  const filteredItems = getFilteredItems();

  // --- ACTIONS ---

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreatePlaylist = async () => {
    if (!token || !userId || selectedItems.length === 0) return;
    setIsCreating(true);

    try {
      let trackUris: string[] = [];
      let sourceAlbums: Album[] = [];

      if (filters.contentType === 'albums') {
          // Fetch full albums to get tracks
          const fullAlbums = await getAlbums(token, selectedItems);
          sourceAlbums = fullAlbums;
          fullAlbums.forEach(album => {
             if (album.tracks?.items) {
                 album.tracks.items.forEach(track => trackUris.push(track.uri));
             }
          });
      } else {
          // Tracks are already selected, just get URIs
          // For DB saving we need structure, so we mock "Albums" from tracks or just save playlist info
          const selectedTracks = tracks.filter(t => selectedItems.includes(t.id));
          selectedTracks.forEach(t => trackUris.push(t.uri));
          
          // Construct pseudo-albums for DB structure compatibility
          // In a real app, DB schema might be more flexible
          sourceAlbums = selectedTracks.map(t => t.album as Album).filter(Boolean);
      }

      if (trackUris.length === 0) throw new Error("No tracks found");

      const playlistName = `BeatMap ${filters.contentType === 'albums' ? 'Albums' : 'Mix'} ${new Date().toLocaleDateString('pt-BR')}`;
      const description = `Gerado via BeatMap. Filtro: ${filters.dateRange}. ${filters.genre ? `Gênero: ${filters.genre}` : ''}`;
      
      const playlist = await createPlaylist(token, userId, playlistName, description);
      await addTracksToPlaylist(token, playlist.id, trackUris);

      if (supabaseUserId) {
        await savePlaylistToDb(supabaseUserId, playlistName, playlist.id, sourceAlbums, filters.genre);
      }

      onPlaylistCreated();
      setSelectedItems([]);
      alert('Playlist criada com sucesso!');

    } catch (error) {
      console.error(error);
      alert('Erro ao criar playlist.');
    } finally {
      setIsCreating(false);
    }
  };

  const togglePreview = (e: React.MouseEvent, url: string | null) => {
      e.stopPropagation();
      if (!url) return;

      if (playingPreview === url) {
          audioRef.current?.pause();
          setPlayingPreview(null);
      } else {
          if (audioRef.current) {
              audioRef.current.pause();
          }
          audioRef.current = new Audio(url);
          audioRef.current.volume = 0.5;
          audioRef.current.play();
          audioRef.current.onended = () => setPlayingPreview(null);
          setPlayingPreview(url);
      }
  };

  // --- RENDER HELPERS ---

  const renderCard = (item: Album | Track) => {
    const isSelected = selectedItems.includes(item.id);
    const image = filters.contentType === 'albums' 
        ? (item as Album).images?.[0]?.url 
        : (item as Track).album?.images?.[0]?.url;
    
    const releaseDate = filters.contentType === 'albums' 
        ? (item as Album).release_date 
        : (item as Track).album?.release_date;

    const previewUrl = filters.contentType === 'tracks' ? (item as Track).preview_url : null;

    return (
      <div 
        key={item.id} 
        onClick={() => toggleSelection(item.id)}
        className={`group relative bg-beatmap-card rounded-xl p-4 transition-all duration-300 hover:bg-white/5 cursor-pointer border ${isSelected ? 'border-beatmap-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'border-transparent hover:border-white/10'}`}
      >
        <div className="relative aspect-square mb-4 rounded-lg overflow-hidden shadow-lg bg-black/40">
          {image && <img src={image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>}
          
          {/* Action Overlay */}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <div className={`rounded-full p-2 ${isSelected ? 'bg-beatmap-primary text-white' : 'bg-white text-black'}`}>
                {isSelected ? <Check size={20} /> : <Plus size={20} />}
              </div>
          </div>

          {/* Preview Button (Tracks Only) */}
          {filters.contentType === 'tracks' && previewUrl && (
              <button 
                onClick={(e) => togglePreview(e, previewUrl)}
                className="absolute bottom-2 right-2 p-2 rounded-full bg-black/60 hover:bg-beatmap-primary text-white backdrop-blur-md transition-colors z-20"
              >
                  {playingPreview === previewUrl ? <Pause size={14} /> : <Play size={14} />}
              </button>
          )}

           {filters.contentType === 'tracks' && !previewUrl && (
              <div className="absolute bottom-2 right-2 p-1.5 rounded bg-black/60 text-gray-400 backdrop-blur-md" title="Sem preview">
                  <Music size={12} />
              </div>
          )}
        </div>

        <h3 className="font-semibold text-white truncate mb-1 text-sm" title={item.name}>{item.name}</h3>
        <p className="text-xs text-gray-400 truncate">{item.artists?.map(a => a.name).join(', ')}</p>
        
        <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {releaseDate ? new Date(releaseDate).toLocaleDateString('pt-BR') : 'N/A'}
          </span>
          {filters.contentType === 'albums' && (
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px] uppercase">
                {(item as Album).album_type}
              </span>
          )}
        </div>
      </div>
    );
  };

  const renderListItem = (item: Album | Track) => {
      const isSelected = selectedItems.includes(item.id);
      const image = filters.contentType === 'albums' 
        ? (item as Album).images?.[0]?.url 
        : (item as Track).album?.images?.[0]?.url;
      const releaseDate = filters.contentType === 'albums' 
        ? (item as Album).release_date 
        : (item as Track).album?.release_date;
      const previewUrl = filters.contentType === 'tracks' ? (item as Track).preview_url : null;

      return (
        <div 
            key={item.id}
            onClick={() => toggleSelection(item.id)}
            className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors border-l-4 ${isSelected ? 'bg-white/10 border-beatmap-primary' : 'hover:bg-white/5 border-transparent'}`}
        >
            <div className="relative w-12 h-12 flex-shrink-0">
                {image && <img src={image} className="w-full h-full rounded object-cover" alt="" />}
                {filters.contentType === 'tracks' && previewUrl && (
                     <button 
                        onClick={(e) => togglePreview(e, previewUrl)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded"
                      >
                         {playingPreview === previewUrl ? <Pause size={16} className="text-white"/> : <Play size={16} className="text-white"/>}
                     </button>
                )}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{item.name}</div>
                <div className="text-sm text-gray-400 truncate">{item.artists?.map(a => a.name).join(', ')}</div>
            </div>

            <div className="hidden sm:block text-sm text-gray-500 w-32 text-right">
                {releaseDate ? new Date(releaseDate).toLocaleDateString('pt-BR') : '-'}
            </div>

            <div className="w-8 flex justify-center">
                 {isSelected ? <Check size={18} className="text-beatmap-primary" /> : <div className="w-4 h-4 rounded-full border border-gray-600"></div>}
            </div>
        </div>
      )
  };

  // --- RENDER MAIN ---

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Header & Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
         <div>
            <h1 className="text-3xl font-bold">Descobrir</h1>
            <p className="text-gray-400 text-sm">Os lançamentos mais quentes mapeados para você.</p>
         </div>
         
         {/* Sub-navigation Tabs */}
         <div className="flex bg-white/5 p-1 rounded-lg">
             <button 
                onClick={() => setFilters({...filters, contentType: 'albums'})}
                className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${filters.contentType === 'albums' ? 'bg-beatmap-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
                <Disc size={16} /> Álbuns
             </button>
             <button 
                onClick={() => setFilters({...filters, contentType: 'tracks'})}
                className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${filters.contentType === 'tracks' ? 'bg-beatmap-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
                <Mic2 size={16} /> Músicas
             </button>
         </div>
      </div>

      {/* 2. Controls & Filters Bar */}
      <div className="bg-beatmap-card/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 space-y-4">
          
          {/* Top Row: Date & Search */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
              
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <input 
                    type="text" 
                    placeholder={`Buscar ${filters.contentType === 'albums' ? 'álbuns' : 'músicas'} ou artistas...`}
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-beatmap-primary transition-all"
                />
                <Filter className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
              </div>

              {/* Date Filters */}
              <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                      {(['day', 'week', 'month', 'custom'] as DateRangeType[]).map((range) => (
                          <button
                            key={range}
                            onClick={() => setFilters({...filters, dateRange: range})}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filters.dateRange === range ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                              {range === 'day' && 'Hoje'}
                              {range === 'week' && '7 Dias'}
                              {range === 'month' && '30 Dias'}
                              {range === 'custom' && 'Custom'}
                          </button>
                      ))}
                  </div>

                  {filters.dateRange === 'custom' && (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                          <input 
                            type="date" 
                            value={filters.customStartDate}
                            onChange={(e) => setFilters({...filters, customStartDate: e.target.value})}
                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-beatmap-primary"
                          />
                          <span className="text-gray-500">-</span>
                          <input 
                            type="date" 
                            value={filters.customEndDate}
                            onChange={(e) => setFilters({...filters, customEndDate: e.target.value})}
                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-beatmap-primary"
                          />
                      </div>
                  )}
              </div>
          </div>

          {/* Bottom Row: Genre & View Mode */}
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-[80%] hide-scrollbar">
                  <button 
                    onClick={() => setFilters({...filters, genre: ''})}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filters.genre === '' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-700 hover:border-white'}`}
                  >
                      Todos
                  </button>
                  {COMMON_GENRES.map(g => (
                    <button 
                        key={g} 
                        onClick={() => setFilters({...filters, genre: g})}
                        className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filters.genre === g ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-700 hover:border-white'}`}
                    >
                        {g}
                    </button>
                  ))}
              </div>

              <div className="flex items-center bg-black/40 rounded-lg p-1">
                  <button 
                    onClick={() => setFilters({...filters, viewMode: 'grid'})}
                    className={`p-1.5 rounded ${filters.viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}
                  >
                      <Grid size={16} />
                  </button>
                  <button 
                    onClick={() => setFilters({...filters, viewMode: 'list'})}
                    className={`p-1.5 rounded ${filters.viewMode === 'list' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}
                  >
                      <ListIcon size={16} />
                  </button>
              </div>
          </div>
      </div>

      {/* 3. Results Area */}
      {loading ? (
           <div className="flex justify-center py-24">
             <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-beatmap-primary"></div>
           </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-beatmap-card/30 rounded-2xl border border-dashed border-white/10">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-600 mb-4" />
            <p className="text-gray-400">Nenhum resultado encontrado para os filtros atuais.</p>
            <button 
                onClick={() => setFilters({...filters, search: '', dateRange: 'week', genre: '', customStartDate: '', customEndDate: ''})}
                className="mt-4 text-beatmap-primary hover:text-white flex items-center gap-2 mx-auto text-sm"
            >
                <RefreshCw size={14} /> Resetar filtros
            </button>
        </div>
      ) : (
          <div className="space-y-8">
              {filters.viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {filteredItems.map(item => renderCard(item))}
                  </div>
              ) : (
                  <div className="flex flex-col gap-2">
                      {filteredItems.map(item => renderListItem(item))}
                  </div>
              )}

              {/* Load More Button */}
              {/* Only show if we haven't filtered everything out locally (heuristic) */}
              {filteredItems.length > 0 && (
                  <div className="flex justify-center pt-4">
                      <button 
                        onClick={() => loadData(true)} 
                        disabled={loadingMore}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-6 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                          {loadingMore && <div className="animate-spin h-3 w-3 border-t-2 border-white rounded-full"></div>}
                          {loadingMore ? 'Carregando...' : 'Carregar Mais'}
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* 4. Floating Action Bar */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 bg-beatmap-card border border-white/10 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
            <span className="text-sm font-medium">
                <span className="text-beatmap-primary font-bold">{selectedItems.length}</span> {filters.contentType === 'albums' ? 'álbuns' : 'faixas'}
            </span>
            <span className="text-[10px] text-gray-400 hidden md:inline">selecionados</span>
          </div>
          <div className="h-6 w-px bg-white/20"></div>
          <button 
            onClick={handleCreatePlaylist}
            disabled={isCreating}
            className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 transform hover:scale-105"
          >
            {isCreating ? <RefreshCw className="animate-spin" size={16}/> : <Plus size={16} />}
            {isCreating ? 'Criando...' : 'Criar Playlist'}
          </button>
        </div>
      )}
    </div>
  );
};