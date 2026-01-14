import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Calendar, Play, Pause, ThumbsUp, ThumbsDown, Heart, CheckCircle, RefreshCw } from 'lucide-react';
import { WeeklyDiscovery, RecommendedTrack } from '../types';
import { getWeeklyDiscovery, updateDiscoveryFeedback, markDiscoverySaved, savePlaylistToDb } from '../lib/db';
import { createPlaylist, addTracksToPlaylist } from '../lib/spotify';

interface DiscoveryProps {
    token: string | null;
    userId: string | null;
    supabaseUserId?: string;
}

export const Discovery: React.FC<DiscoveryProps> = ({ token, userId, supabaseUserId }) => {
    const [discovery, setDiscovery] = useState<WeeklyDiscovery | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Audio Preview
    const [playingPreview, setPlayingPreview] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const load = async () => {
            if (token && userId) {
                setLoading(true);
                try {
                    const data = await getWeeklyDiscovery(token, userId);
                    setDiscovery(data);
                } catch (e) {
                    console.error("Discovery error", e);
                } finally {
                    setLoading(false);
                }
            }
        };
        load();
    }, [token, userId]);

    const togglePreview = (url: string | null) => {
        if (!url) return;
        if (playingPreview === url) {
            audioRef.current?.pause();
            setPlayingPreview(null);
        } else {
            if (audioRef.current) audioRef.current.pause();
            audioRef.current = new Audio(url);
            audioRef.current.volume = 0.5;
            audioRef.current.play();
            audioRef.current.onended = () => setPlayingPreview(null);
            setPlayingPreview(url);
        }
    };

    const handleFeedback = (trackId: string, type: 'like' | 'dislike') => {
        if (!userId || !discovery) return;
        const updated = updateDiscoveryFeedback(userId, discovery.weekId, trackId, type);
        if (updated) setDiscovery(updated);
    };

    const handleSavePlaylist = async () => {
        if (!token || !userId || !discovery || saving) return;
        setSaving(true);
        try {
            const date = new Date().toLocaleDateString('pt-BR');
            const name = `Descoberta Semanal BeatMap - ${date}`;
            const uris = discovery.tracks.map(t => t.uri);
            
            const playlist = await createPlaylist(token, userId, name, 'Sua seleção personalizada semanal do BeatMap.');
            await addTracksToPlaylist(token, playlist.id, uris);
            
            if (supabaseUserId) {
                await markDiscoverySaved(userId, discovery.weekId);
                // Convert Tracks to pseudo-Albums structure for DB compatibility if needed, 
                // or update DB to handle playlists from tracks. 
                // For now, we reuse the existing savePlaylistToDb which expects albums, 
                // so we construct pseudo-albums from tracks.
                const pseudoAlbums = discovery.tracks.map(t => t.album).filter(Boolean) as any[];
                await savePlaylistToDb(supabaseUserId, name, playlist.id, pseudoAlbums, 'Discovery');
            }
            
            setDiscovery(prev => prev ? { ...prev, savedToLibrary: true } : null);
            alert('Playlist salva com sucesso no Spotify!');
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar playlist.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-beatmap-primary"></div>
        </div>
    );

    if (!discovery) return null;

    return (
        <div className="space-y-8 pb-24">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-900 to-beatmap-dark rounded-3xl p-8 border border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Sparkles size={200} />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="w-40 h-40 bg-gradient-to-br from-beatmap-primary to-pink-600 rounded-xl shadow-2xl flex items-center justify-center shrink-0">
                        <Sparkles size={64} className="text-white drop-shadow-md" />
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-beatmap-primary font-bold tracking-wider text-xs uppercase mb-2">
                             <Calendar size={14} /> 
                             Semana {discovery.weekId.split('-W')[1]} de {discovery.weekId.split('-W')[0]}
                        </div>
                        <h1 className="text-4xl font-black text-white mb-2">Sua Descoberta Semanal</h1>
                        <p className="text-gray-300 max-w-xl">
                            Uma seleção única de 30 músicas baseada no que você tem ouvido. 
                            Atualizada toda segunda-feira com o melhor algoritmo de recomendação.
                        </p>
                        
                        <div className="mt-6 flex items-center gap-4">
                            <button 
                                onClick={handleSavePlaylist}
                                disabled={discovery.savedToLibrary || saving}
                                className={`
                                    px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all 
                                    ${discovery.savedToLibrary 
                                        ? 'bg-green-500/20 text-green-400 cursor-default' 
                                        : 'bg-white text-black hover:bg-gray-200 hover:scale-105 shadow-lg shadow-white/10'}
                                `}
                            >
                                {saving ? <RefreshCw className="animate-spin" size={20} /> : (
                                    discovery.savedToLibrary ? <CheckCircle size={20} /> : <Heart size={20} fill="currentColor" className="text-red-500" />
                                )}
                                {discovery.savedToLibrary ? 'Salva na Biblioteca' : 'Salvar Playlist Completa'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Track List */}
            <div className="bg-beatmap-card/50 rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 text-sm font-bold text-gray-400">
                    Músicas Recomendadas ({discovery.tracks.length})
                </div>
                <div className="divide-y divide-white/5">
                    {discovery.tracks.map((track, idx) => (
                        <div key={track.id} className="group p-3 flex items-center gap-4 hover:bg-white/5 transition-colors">
                            <div className="w-8 text-center text-gray-500 font-mono text-sm">{idx + 1}</div>
                            
                            <div className="relative w-12 h-12 shrink-0 rounded overflow-hidden">
                                <img src={track.album?.images[0]?.url} alt={track.name} className="w-full h-full object-cover" />
                                {track.preview_url && (
                                    <button 
                                        onClick={() => togglePreview(track.preview_url)}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {playingPreview === track.preview_url ? <Pause size={18} /> : <Play size={18} />}
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-white truncate">{track.name}</div>
                                <div className="text-sm text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</div>
                                <div className="text-xs text-beatmap-primary/80 mt-1 truncate flex items-center gap-1">
                                    <Sparkles size={10} /> {track.reason}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleFeedback(track.id, 'like')}
                                    className={`p-2 rounded-full transition-colors ${track.feedback === 'like' ? 'bg-green-500/20 text-green-500' : 'hover:bg-white/10 text-gray-400'}`}
                                >
                                    <ThumbsUp size={16} />
                                </button>
                                <button 
                                    onClick={() => handleFeedback(track.id, 'dislike')}
                                    className={`p-2 rounded-full transition-colors ${track.feedback === 'dislike' ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10 text-gray-400'}`}
                                >
                                    <ThumbsDown size={16} />
                                </button>
                            </div>

                            <div className="text-sm text-gray-500 font-mono w-16 text-right">
                                {Math.floor(track.duration_ms / 60000)}:{((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};