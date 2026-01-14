import React, { useState, useEffect, useRef } from 'react';
import { 
    Filter, Calendar, Music, Plus, ExternalLink, Check, RefreshCw, 
    Disc, Mic2, Grid, List as ListIcon, Play, Pause, AlertCircle, LayoutGrid, Smartphone, Maximize2 
} from 'lucide-react';
import { Album, FilterState, Track, DateRangeType } from '../types';
import { 
    fetchNewReleases, createPlaylist, addTracksToPlaylist, getAlbums, 
    searchByGenre, searchNewTracks, isDateInInterval 
} from '../lib/spotify';
import { savePlaylistToDb } from '../lib/db';
import { useLayout } from '../contexts/LayoutContext';

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
  const { settings, updateSettings } = useLayout();
  
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
    viewMode: 'grid' // kept for type compatibility, but effectively controlled by context
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
          const selectedTracks = tracks.filter(t => selectedItems.includes(t.id));
          selectedTracks.forEach(t => trackUris.push(t.uri));
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

  // --- VIEW RENDERING HELPERS ---

  // Determine container classes based on mode
  const getGridClasses = () => {
      switch (settings.mode) {
          case 'grid-compact': return 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3';
          case 'grid-normal': return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6';
          case 'cards': return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8';
          case 'list': return 'flex flex-col gap-2';
          default: return 'grid grid-cols-2 md:grid-cols-4 gap-6';
      }
  };

  const renderCard = (item: Album | Track) => {
    const isSelected = selectedItems.includes(item.id);
    const image = filters.contentType === 'albums' 
        ? (item as Album).images?.[0]?.url 
        : (item as Track).album?.images?.[0]?.url;
    
    const releaseDate = filters.contentType === 'albums' 
        ? (item as Album).release_date 
        : (item as Track).album?.release_date;

    const previewUrl = filters.contentType === 'tracks' ? (item as Track).preview_url : null;
    
    const isCompact = settings.mode === 'grid-compact';
    const isLarge = settings.mode === 'cards';

    return (
      <div 
        key={item.id} 
        onClick={() => toggleSelection(item.id)}
        className={`group relative bg-beatmap-card rounded-xl transition-all duration-300 hover:bg-beatmap-text/5 cursor-pointer border 
            ${isSelected ? 'border-beatmap-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'border-transparent hover:border-beatmap-border/10'}
            ${settings.density === 'compact' ? 'p-2' : isLarge ? 'p-6' : 'p-4'}
        `}
      >
        <div className={`relative aspect-square rounded-lg overflow-hidden shadow-lg bg-black/40 ${isCompact ? 'mb-2' : 'mb-4'}`}>
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
        </div>

        <h3 className={`font-semibold text-beatmap-text truncate ${isCompact ? 'text-xs' : isLarge ? 'text-xl' : 'text-sm'}`} title={item.name}>{item.name}</h3>
        <p className={`text-beatmap-muted truncate ${isCompact ? 'text-[10px]' : 'text-xs'}`}>{item.artists?.map(a => a.name).join(', ')}</p>
        
        {!isCompact && (
            <div className="mt-3 flex items-center justify-between text-[10px] text-beatmap-muted/80">
            <span className="flex items-center gap-1">
                <Calendar size={10} />
                {releaseDate ? new Date(releaseDate).toLocaleDateString('pt-BR') : 'N/A'}
            </span>
            {filters.contentType === 'albums' && (
                <span className="bg-beatmap-text/10 px-1.5 py-0.5 rounded text-[9px] uppercase">
                    {(item as Album).album_type}
                </span>
            )}
            </div>
        )}
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
      
      const paddingClass = settings.density === 'compact' ? 'p-2' : settings.density === 'expanded' ? 'p-4' : 'p-3';

      return (
        <div 
            key={item.id}
            onClick={() => toggleSelection(item.id)}
            className={`flex items-center gap-4 ${paddingClass} rounded-lg cursor-pointer transition-colors border-l-4 ${isSelected ? 'bg-beatmap-text/10 border-beatmap-primary' : 'hover:bg-beatmap-text/5 border-transparent'}`}
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
                <div className="font-medium text-beatmap-text truncate">{item.name}</div>
                <div className="text-sm text-beatmap-muted truncate">{item.artists?.map(a => a.name).join(', ')}</div>
            </div>

            <div className="hidden sm:block text-sm text-beatmap-muted w-32 text-right">
                {releaseDate ? new Date(releaseDate).toLocaleDateString('pt-BR') : '-'}
            </div>

            <div className="w-8 flex justify-center">
                 {isSelected ? <Check size={18} className="text-beatmap-primary" /> : <div className="w-4 h-4 rounded-full border border-beatmap-muted/50"></div>}
            </div>
        </div>
      )
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Header & Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
         <div>
            <h1 className="text-3xl font-bold text-beatmap-text">Descobrir</h1>
            <p className="text-beatmap-muted text-sm">Os lançamentos mais quentes mapeados para você.</p>
         </div>
         
         <div className="flex bg-beatmap-text/5 p-1 rounded-lg border border-beatmap-border/5">
             <button 
                onClick={() => setFilters({...filters, contentType: 'albums'})}
                className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${filters.contentType === 'albums' ? 'bg-beatmap-primary text-white shadow-lg' : 'text-beatmap-muted hover:text-beatmap-text'}`}
             >
                <Disc size={16} /> Álbuns
             </button>
             <button 
                onClick={() => setFilters({...filters, contentType: 'tracks'})}
                className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${filters.contentType === 'tracks' ? 'bg-beatmap-primary text-white shadow-lg' : 'text-beatmap-muted hover:text-beatmap-text'}`}
             >
                <Mic2 size={16} /> Músicas
             </button>
         </div>
      </div>

      {/* 2. Controls & Filters Bar */}
      <div className="bg-beatmap-card/50 backdrop-blur-md border border-beatmap-border/10 rounded-2xl p-4 space-y-4">
          
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <input 
                    type="text" 
                    placeholder={`Buscar ${filters.contentType === 'albums' ? 'álbuns' : 'músicas'} ou artistas...`}
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full bg-beatmap-bg/60 border border-beatmap-border/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-beatmap-primary transition-all text-beatmap-text placeholder-beatmap-muted"
                />
                <Filter className="absolute left-3 top-2.5 text-beatmap-muted w-4 h-4" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-beatmap-bg/60 rounded-lg p-1 border border-beatmap-border/10">
                      {(['day', 'week', 'month', 'custom'] as DateRangeType[]).map((range) => (
                          <button
                            key={range}
                            onClick={() => setFilters({...filters, dateRange: range})}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filters.dateRange === range ? 'bg-beatmap-text/10 text-beatmap-text' : 'text-beatmap-muted hover:text-beatmap-text'}`}
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
                            className="bg-beatmap-bg/60 border border-beatmap-border/10 rounded-lg px-2 py-1.5 text-xs text-beatmap-text focus:outline-none focus:border-beatmap-primary"
                          />
                          <span className="text-beatmap-muted">-</span>
                          <input 
                            type="date" 
                            value={filters.customEndDate}
                            onChange={(e) => setFilters({...filters, customEndDate: e.target.value})}
                            className="bg-beatmap-bg/60 border border-beatmap-border/10 rounded-lg px-2 py-1.5 text-xs text-beatmap-text focus:outline-none focus:border-beatmap-primary"
                          />
                      </div>
                  )}
              </div>
          </div>

          <div className="flex items-center justify-between border-t border-beatmap-border/5 pt-4">
              <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-[60%] hide-scrollbar">
                  <button 
                    onClick={() => setFilters({...filters, genre: ''})}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filters.genre === '' ? 'bg-beatmap-text text-beatmap-bg border-beatmap-text' : 'bg-transparent text-beatmap-muted border-beatmap-border/20 hover:border-beatmap-border'}`}
                  >
                      Todos
                  </button>
                  {COMMON_GENRES.map(g => (
                    <button 
                        key={g} 
                        onClick={() => setFilters({...filters, genre: g})}
                        className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filters.genre === g ? 'bg-beatmap-text text-beatmap-bg border-beatmap-text' : 'bg-transparent text-beatmap-muted border-beatmap-border/20 hover:border-beatmap-border'}`}
                    >
                        {g}
                    </button>
                  ))}
              </div>

              {/* Advanced View Controls */}
              <div className="flex items-center bg-beatmap-bg/60 rounded-lg p-1 gap-1">
                  <button 
                    onClick={() => updateSettings({ mode: 'grid-compact' })}
                    title="Grid Compacto"
                    className={`p-1.5 rounded ${settings.mode === 'grid-compact' ? 'bg-beatmap-text/20 text-beatmap-text' : 'text-beatmap-muted hover:text-beatmap-text'}`}
                  >
                      <Smartphone size={16} />
                  </button>
                  <button 
                    onClick={() => updateSettings({ mode: 'grid-normal' })}
                    title="Grid Normal"
                    className={`p-1.5 rounded ${settings.mode === 'grid-normal' ? 'bg-beatmap-text/20 text-beatmap-text' : 'text-beatmap-muted hover:text-beatmap-text'}`}
                  >
                      <LayoutGrid size={16} />
                  </button>
                   <button 
                    onClick={() => updateSettings({ mode: 'cards' })}
                    title="Cards Expandidos"
                    className={`p-1.5 rounded ${settings.mode === 'cards' ? 'bg-beatmap-text/20 text-beatmap-text' : 'text-beatmap-muted hover:text-beatmap-text'}`}
                  >
                      <Maximize2 size={16} />
                  </button>
                  <button 
                    onClick={() => updateSettings({ mode: 'list' })}
                    title="Lista"
                    className={`p-1.5 rounded ${settings.mode === 'list' ? 'bg-beatmap-text/20 text-beatmap-text' : 'text-beatmap-muted hover:text-beatmap-text'}`}
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
        <div className="text-center py-20 bg-beatmap-card/30 rounded-2xl border border-dashed border-beatmap-border/10">
            <AlertCircle className="mx-auto h-12 w-12 text-beatmap-muted mb-4" />
            <p className="text-beatmap-muted">Nenhum resultado encontrado para os filtros atuais.</p>
            <button 
                onClick={() => setFilters({...filters, search: '', dateRange: 'week', genre: '', customStartDate: '', customEndDate: ''})}
                className="mt-4 text-beatmap-primary hover:text-beatmap-text flex items-center gap-2 mx-auto text-sm"
            >
                <RefreshCw size={14} /> Resetar filtros
            </button>
        </div>
      ) : (
          <div className="space-y-8">
              <div className={getGridClasses()}>
                  {settings.mode === 'list' 
                    ? filteredItems.map(item => renderListItem(item))
                    : filteredItems.map(item => renderCard(item))
                  }
              </div>

              {filteredItems.length > 0 && (
                  <div className="flex justify-center pt-4">
                      <button 
                        onClick={() => loadData(true)} 
                        disabled={loadingMore}
                        className="bg-beatmap-card border border-beatmap-border/10 text-beatmap-text px-6 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2 hover:bg-beatmap-text/10"
                      >
                          {loadingMore && <div className="animate-spin h-3 w-3 border-t-2 border-beatmap-text rounded-full"></div>}
                          {loadingMore ? 'Carregando...' : 'Carregar Mais'}
                      </button>
                  </div>
              )}
          </div>
      )}

      {selectedItems.length > 0 && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 bg-beatmap-card border border-beatmap-border/20 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
            <span className="text-sm font-medium text-beatmap-text">
                <span className="text-beatmap-primary font-bold">{selectedItems.length}</span> {filters.contentType === 'albums' ? 'álbuns' : 'faixas'}
            </span>
            <span className="text-[10px] text-beatmap-muted hidden md:inline">selecionados</span>
          </div>
          <div className="h-6 w-px bg-beatmap-border/20"></div>
          <button 
            onClick={handleCreatePlaylist}
            disabled={isCreating}
            className="flex items-center gap-2 bg-beatmap-text text-beatmap-bg px-5 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-50 transform hover:scale-105"
          >
            {isCreating ? <RefreshCw className="animate-spin" size={16}/> : <Plus size={16} />}
            {isCreating ? 'Criando...' : 'Criar Playlist'}
          </button>
        </div>
      )}
    </div>
  );
};