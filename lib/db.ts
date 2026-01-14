import { supabase } from './supabase';
import { DbPlaylist, DbPlaylistTrack, HistoryItem, Track, Album, UserStats, Notification, FollowedArtist, WeeklyDiscovery, RecommendedTrack } from '../types';
import { fetchRecommendations, fetchUserTopItems } from './spotify';

export const getUserHistory = async (userId: string): Promise<HistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_tracks (count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      playlistName: item.name,
      trackCount: item.playlist_tracks[0]?.count || 0,
      createdAt: item.created_at,
      spotifyUrl: `https://open.spotify.com/playlist/${item.spotify_playlist_id}`
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const savePlaylistToDb = async (
  userId: string, 
  playlistName: string, 
  spotifyPlaylistId: string,
  albums: Album[],
  genreContext?: string
) => {
  try {
    // 1. Create Playlist Record
    const { data: playlistData, error: playlistError } = await supabase
      .from('playlists')
      .insert({
        user_id: userId,
        name: playlistName,
        spotify_playlist_id: spotifyPlaylistId
      })
      .select()
      .single();

    if (playlistError || !playlistData) {
      throw playlistError || new Error('Failed to create DB playlist');
    }

    // 2. Prepare Tracks
    const tracksToInsert: DbPlaylistTrack[] = [];
    
    albums.forEach(album => {
      if (album.tracks?.items) {
        album.tracks.items.forEach(track => {
          tracksToInsert.push({
            playlist_id: playlistData.id,
            spotify_track_id: track.id,
            track_name: track.name,
            artist_name: track.artists.map(a => a.name).join(', '),
            album_name: album.name,
            duration_ms: track.duration_ms,
            genre: genreContext || album.artists[0].genres?.[0] || 'Geral', 
            release_date: album.release_date,
            image_url: album.images[0]?.url || ''
          });
        });
      }
    });

    // 3. Insert Tracks (Batch)
    if (tracksToInsert.length > 0) {
      const { error: tracksError } = await supabase
        .from('playlist_tracks')
        .insert(tracksToInsert);
      
      if (tracksError) console.error('Error inserting tracks:', tracksError);
    }

    return playlistData;
  } catch (e) {
    console.error('Database save error:', e);
    // Non-blocking error for UI
    return null;
  }
};

export const deletePlaylist = async (playlistId: string) => {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId);

  if (error) throw error;
};

export const getUserStatistics = async (userId: string): Promise<UserStats> => {
    try {
        // Fetch all user playlists and their tracks
        const { data: playlists, error: pError } = await supabase
            .from('playlists')
            .select('id, created_at')
            .eq('user_id', userId);
        
        if (pError || !playlists) throw pError || new Error("No playlists");

        const playlistIds = playlists.map(p => p.id);
        
        let tracks: any[] = [];
        if (playlistIds.length > 0) {
            const { data: tData, error: tError } = await supabase
                .from('playlist_tracks')
                .select('*')
                .in('playlist_id', playlistIds);
            
            if (tError) console.error(tError);
            tracks = tData || [];
        }

        // 1. Basic Counts
        const totalPlaylists = playlists.length;
        const totalTracksSaved = tracks.length;
        const totalTimeMs = tracks.reduce((acc, curr) => acc + curr.duration_ms, 0);

        // 2. Unique Artists
        const uniqueArtists = new Set(tracks.map(t => t.artist_name)).size;

        // 3. Genres
        const genreCounts: Record<string, number> = {};
        tracks.forEach(t => {
            if (t.genre) {
                genreCounts[t.genre] = (genreCounts[t.genre] || 0) + 1;
            }
        });

        const topGenres = Object.entries(genreCounts)
            .map(([name, count]) => ({ name, count, percent: 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        
        // Calculate percentages
        const totalGenreCount = Object.values(genreCounts).reduce((a, b) => a + b, 0);
        topGenres.forEach(g => g.percent = Math.round((g.count / totalGenreCount) * 100));

        // 4. Activity by Month
        const activityMap: Record<string, { playlists: number, tracks: number }> = {};
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        // Initialize last 6 months
        const today = new Date();
        for(let i=5; i>=0; i--) {
             const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
             const key = `${months[d.getMonth()]}`;
             activityMap[key] = { playlists: 0, tracks: 0 };
        }

        playlists.forEach(p => {
            const d = new Date(p.created_at);
            const key = months[d.getMonth()];
            if (activityMap[key]) {
                activityMap[key].playlists++;
            }
        });

        tracks.forEach(t => {
            const playlist = playlists.find(p => p.id === t.playlist_id);
            if (playlist) {
                const d = new Date(playlist.created_at);
                const key = months[d.getMonth()];
                if (activityMap[key]) {
                    activityMap[key].tracks++;
                }
            }
        });

        const activityByMonth = Object.entries(activityMap).map(([month, data]) => ({
            month,
            playlists: data.playlists,
            tracks: data.tracks
        }));

        return {
            totalPlaylists,
            totalTracksSaved,
            totalTimeMs,
            uniqueArtists,
            topGenres,
            activityByMonth
        };

    } catch (e) {
        console.error("Stats Error", e);
        return {
            totalPlaylists: 0,
            totalTracksSaved: 0,
            totalTimeMs: 0,
            uniqueArtists: 0,
            topGenres: [],
            activityByMonth: []
        };
    }
};

// --- Notifications & Following System (Simulated w/ LocalStorage/Supabase Hybrid) ---

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    // In a real app, this would query the 'notifications' table
    // For this demo, we'll return mock data combined with localStorage state
    const mock: Notification[] = [
        {
            id: 'notif-1',
            user_id: userId,
            title: 'Novo Lançamento!',
            message: 'Alok lançou um novo single: "Deep Down". Ouça agora.',
            type: 'release',
            is_read: false,
            created_at: new Date().toISOString(),
            image_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=100&h=100&fit=crop'
        },
        {
            id: 'notif-2',
            user_id: userId,
            title: 'Resumo Semanal',
            message: 'Seu resumo da semana está pronto. Você descobriu 12 novas músicas.',
            type: 'system',
            is_read: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
        }
    ];

    // Check localStorage for read status overrides
    const readIds = JSON.parse(localStorage.getItem(`read_notifs_${userId}`) || '[]');
    return mock.map(n => ({
        ...n,
        is_read: n.is_read || readIds.includes(n.id)
    }));
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
    // Simulate DB update
    const readIds = JSON.parse(localStorage.getItem(`read_notifs_${userId}`) || '[]');
    if (!readIds.includes(notificationId)) {
        readIds.push(notificationId);
        localStorage.setItem(`read_notifs_${userId}`, JSON.stringify(readIds));
    }
};

export const markAllNotificationsAsRead = async (userId: string) => {
    const notifs = await getNotifications(userId);
    const readIds = notifs.map(n => n.id);
    localStorage.setItem(`read_notifs_${userId}`, JSON.stringify(readIds));
};

export const getFollowedArtists = async (userId: string): Promise<string[]> => {
    // Returns list of Artist IDs
    return JSON.parse(localStorage.getItem(`followed_artists_${userId}`) || '[]');
};

export const toggleFollowArtist = async (userId: string, artistId: string, artistName: string, imageUrl: string) => {
    const current = await getFollowedArtists(userId);
    let updated;
    
    if (current.includes(artistId)) {
        updated = current.filter(id => id !== artistId);
    } else {
        updated = [...current, artistId];
        // Simulate sending a "New Follower" notification to system (noop)
    }
    
    localStorage.setItem(`followed_artists_${userId}`, JSON.stringify(updated));
    return updated.includes(artistId);
};

// --- Weekly Discovery System ---

const getWeekId = () => {
    const d = new Date();
    const d2 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d2.setUTCDate(d2.getUTCDate() + 4 - (d2.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d2.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (d2.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return `${d2.getUTCFullYear()}-W${weekNo}`;
};

export const getWeeklyDiscovery = async (token: string, userId: string): Promise<WeeklyDiscovery> => {
    const weekId = getWeekId();
    const storageKey = `weekly_discovery_${userId}_${weekId}`;
    
    const stored = localStorage.getItem(storageKey);
    if (stored) {
        return JSON.parse(stored);
    }

    // Generate New Discovery
    console.log("Generating new Weekly Discovery...");
    
    // 1. Get Top Artists for seeding
    const topArtists = await fetchUserTopItems(token, 'artists', 'short_term', 5);
    const seedIds = topArtists.map((a: any) => a.id).slice(0, 3);
    const seedNames = topArtists.map((a: any) => a.name).slice(0, 3);
    
    // 2. Fetch Recommendations
    // If no top artists (new user), fetch recommendations for 'pop'
    const tracks = await fetchRecommendations(token, seedIds, [], [], 30);
    
    // 3. Format
    const reasonText = seedNames.length > 0 
        ? `Baseado em ${seedNames.join(', ')} e outros.`
        : `Baseado nas tendências de hoje.`;

    const discovery: WeeklyDiscovery = {
        id: `wd-${weekId}`,
        weekId: weekId,
        generatedAt: new Date().toISOString(),
        savedToLibrary: false,
        tracks: tracks.map(t => ({
            ...t,
            reason: reasonText,
            feedback: null
        }))
    };

    localStorage.setItem(storageKey, JSON.stringify(discovery));
    return discovery;
};

export const updateDiscoveryFeedback = (userId: string, weekId: string, trackId: string, type: 'like' | 'dislike') => {
    const storageKey = `weekly_discovery_${userId}_${weekId}`;
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    const data: WeeklyDiscovery = JSON.parse(stored);
    const updatedTracks = data.tracks.map(t => {
        if (t.id === trackId) {
            return { ...t, feedback: t.feedback === type ? null : type };
        }
        return t;
    });

    const updatedData = { ...data, tracks: updatedTracks };
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
    return updatedData;
};

export const markDiscoverySaved = (userId: string, weekId: string) => {
    const storageKey = `weekly_discovery_${userId}_${weekId}`;
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    const data = JSON.parse(stored);
    data.savedToLibrary = true;
    localStorage.setItem(storageKey, JSON.stringify(data));
};