import { supabase } from './supabase';
import { DbPlaylist, DbPlaylistTrack, HistoryItem, Track, Album, UserStats, Notification, FollowedArtist, WeeklyDiscovery, RecommendedTrack, LayoutSettings, UserSettings, Theme, DbCustomTheme } from '../types';
import { fetchRecommendations, fetchUserTopItems } from './spotify';

// --- HISTORY & PLAYLISTS ---

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
    
    // 4. Update Analytics (Async Fire & Forget)
    updateUserAnalytics(userId);

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

// --- ANALYTICS ---

const updateUserAnalytics = async (userId: string) => {
    // This calls the expensive calculation and saves to user_analytics
    // Useful for caching stats to avoid re-calculating on every dashboard load in future
    try {
        const stats = await calculateUserStatistics(userId);
        await supabase.from('user_analytics').upsert({
            user_id: userId,
            total_playlists: stats.totalPlaylists,
            total_tracks_saved: stats.totalTracksSaved,
            total_time_ms: stats.totalTimeMs,
            top_genres: stats.topGenres,
            activity_history: stats.activityByMonth,
            last_updated: new Date().toISOString()
        });
    } catch(e) {
        console.error("Failed to update analytics cache", e);
    }
};

const calculateUserStatistics = async (userId: string): Promise<UserStats> => {
    // Calculates fresh stats from raw playlist data
    const { data: playlists } = await supabase
        .from('playlists')
        .select('id, created_at')
        .eq('user_id', userId);
    
    if (!playlists) return {
        totalPlaylists: 0, totalTracksSaved: 0, totalTimeMs: 0, uniqueArtists: 0, topGenres: [], activityByMonth: []
    };

    const playlistIds = playlists.map(p => p.id);
    
    let tracks: any[] = [];
    if (playlistIds.length > 0) {
        const { data: tData } = await supabase
            .from('playlist_tracks')
            .select('*')
            .in('playlist_id', playlistIds);
        tracks = tData || [];
    }

    const totalPlaylists = playlists.length;
    const totalTracksSaved = tracks.length;
    const totalTimeMs = tracks.reduce((acc, curr) => acc + curr.duration_ms, 0);
    const uniqueArtists = new Set(tracks.map(t => t.artist_name)).size;

    const genreCounts: Record<string, number> = {};
    tracks.forEach(t => {
        if (t.genre) genreCounts[t.genre] = (genreCounts[t.genre] || 0) + 1;
    });

    const topGenres = Object.entries(genreCounts)
        .map(([name, count]) => ({ name, count, percent: 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    const totalGenreCount = Object.values(genreCounts).reduce((a, b) => a + b, 0);
    topGenres.forEach(g => g.percent = Math.round((g.count / totalGenreCount) * 100));

    // Activity
    const activityMap: Record<string, { playlists: number, tracks: number }> = {};
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const today = new Date();
    for(let i=5; i>=0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${months[d.getMonth()]}`;
            activityMap[key] = { playlists: 0, tracks: 0 };
    }
    playlists.forEach(p => {
        const d = new Date(p.created_at);
        const key = months[d.getMonth()];
        if (activityMap[key]) activityMap[key].playlists++;
    });
    tracks.forEach(t => {
        const playlist = playlists.find(p => p.id === t.playlist_id);
        if (playlist) {
            const d = new Date(playlist.created_at);
            const key = months[d.getMonth()];
            if (activityMap[key]) activityMap[key].tracks++;
        }
    });

    return {
        totalPlaylists,
        totalTracksSaved,
        totalTimeMs,
        uniqueArtists,
        topGenres,
        activityByMonth: Object.entries(activityMap).map(([month, data]) => ({ month, ...data }))
    };
};

export const getUserStatistics = async (userId: string): Promise<UserStats> => {
    // Try to get cached analytics first
    const { data: cached } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (cached) {
        // Return cached, but fire an update in background if old
        const lastUpdate = new Date(cached.last_updated);
        const hoursDiff = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
        if (hoursDiff > 24) {
             updateUserAnalytics(userId); // refresh silently
        }
        return {
            totalPlaylists: cached.total_playlists,
            totalTracksSaved: cached.total_tracks_saved,
            totalTimeMs: cached.total_time_ms,
            uniqueArtists: 0, // Not stored in basic schema, could calculate
            topGenres: cached.top_genres,
            activityByMonth: cached.activity_history
        };
    }

    // Fallback to calculation
    return calculateUserStatistics(userId);
};

// --- PREFERENCES & SETTINGS ---

export interface UserPreferencesData {
    user_id: string;
    theme_id?: string;
    custom_theme_data?: any;
    layout_settings?: LayoutSettings;
    notification_settings?: UserSettings;
    created_at?: string;
    updated_at?: string;
}

export const getUserPreferences = async (userId: string): Promise<UserPreferencesData | null> => {
    const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
    return data as UserPreferencesData | null;
};

export const saveUserPreferences = async (
    userId: string, 
    preferences: Partial<{
        theme_id: string;
        custom_theme_data: Theme;
        layout_settings: LayoutSettings;
        notification_settings: UserSettings;
    }>
) => {
    // Upsert preference
    await supabase.from('user_preferences').upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
    });
};

// --- CUSTOM THEMES ---

export const getCustomThemes = async (userId: string): Promise<Theme[]> => {
    const { data } = await supabase
        .from('custom_themes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (!data) return [];
    
    return data.map(d => ({
        id: d.id,
        name: d.name,
        colors: d.colors,
        isCustom: true
    }));
};

export const saveCustomTheme = async (userId: string, theme: Theme) => {
    const { data, error } = await supabase
        .from('custom_themes')
        .insert({
            user_id: userId,
            name: theme.name,
            colors: theme.colors
        })
        .select()
        .single();
    
    if (error) throw error;
    return { ...theme, id: data.id }; // Return theme with new DB ID
};

export const deleteCustomTheme = async (userId: string, themeId: string) => {
    await supabase
        .from('custom_themes')
        .delete()
        .eq('id', themeId)
        .eq('user_id', userId);
};

// --- NOTIFICATIONS ---

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) console.error(error);
    return data || [];
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId); // security
};

export const markAllNotificationsAsRead = async (userId: string) => {
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);
};

// --- FOLLOWED ARTISTS ---

export const getFollowedArtists = async (userId: string): Promise<string[]> => {
    const { data } = await supabase
        .from('user_followed_artists')
        .select('artist_id')
        .eq('user_id', userId);
    
    return data?.map(d => d.artist_id) || [];
};

export const toggleFollowArtist = async (userId: string, artistId: string, artistName: string, imageUrl: string) => {
    // Check if exists
    const { data: existing } = await supabase
        .from('user_followed_artists')
        .select('id')
        .eq('user_id', userId)
        .eq('artist_id', artistId)
        .single();

    if (existing) {
        // Unfollow
        await supabase
            .from('user_followed_artists')
            .delete()
            .eq('id', existing.id);
        return false;
    } else {
        // Follow
        await supabase
            .from('user_followed_artists')
            .insert({
                user_id: userId,
                artist_id: artistId,
                artist_name: artistName,
                image_url: imageUrl
            });
        
        // Create Notification for system feedback
        await supabase.from('notifications').insert({
            user_id: userId,
            title: 'Novo Artista Seguido',
            message: `Você agora está recebendo alertas de ${artistName}.`,
            type: 'system',
            image_url: imageUrl
        });

        return true;
    }
};

// --- WEEKLY DISCOVERY ---

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
    
    // Check DB first
    const { data: existing } = await supabase
        .from('weekly_discovery')
        .select('*')
        .eq('user_id', userId)
        .eq('week_id', weekId)
        .single();
    
    if (existing) {
        return {
            id: existing.id,
            weekId: existing.week_id,
            tracks: existing.tracks,
            savedToLibrary: existing.saved_to_library,
            generatedAt: existing.generated_at
        };
    }

    // Generate New Discovery if not found
    console.log("Generating new Weekly Discovery...");
    
    const topArtists = await fetchUserTopItems(token, 'artists', 'short_term', 5);
    const seedIds = topArtists.map((a: any) => a.id).slice(0, 3);
    const seedNames = topArtists.map((a: any) => a.name).slice(0, 3);
    
    const tracks = await fetchRecommendations(token, seedIds, [], [], 30);
    
    const reasonText = seedNames.length > 0 
        ? `Baseado em ${seedNames.join(', ')} e outros.`
        : `Baseado nas tendências de hoje.`;

    const discoveryTracks = tracks.map(t => ({
        ...t,
        reason: reasonText,
        feedback: null
    }));

    // Save to DB
    const { data: newRecord, error } = await supabase
        .from('weekly_discovery')
        .insert({
            user_id: userId,
            week_id: weekId,
            tracks: discoveryTracks
        })
        .select()
        .single();

    if (error || !newRecord) {
        console.error("Failed to save discovery", error);
        // Fallback to in-memory return
        return {
            id: 'temp',
            weekId,
            tracks: discoveryTracks,
            savedToLibrary: false,
            generatedAt: new Date().toISOString()
        };
    }

    return {
        id: newRecord.id,
        weekId: newRecord.week_id,
        tracks: newRecord.tracks,
        savedToLibrary: newRecord.saved_to_library,
        generatedAt: newRecord.generated_at
    };
};

export const updateDiscoveryFeedback = async (userId: string, weekId: string, trackId: string, type: 'like' | 'dislike') => {
    // Fetch current
    const { data: existing } = await supabase
        .from('weekly_discovery')
        .select('*')
        .eq('user_id', userId)
        .eq('week_id', weekId)
        .single();
    
    if (!existing) return null;

    const updatedTracks = (existing.tracks as RecommendedTrack[]).map(t => {
        if (t.id === trackId) {
            return { ...t, feedback: t.feedback === type ? null : type };
        }
        return t;
    });

    await supabase
        .from('weekly_discovery')
        .update({ tracks: updatedTracks })
        .eq('id', existing.id);
    
    return {
        id: existing.id,
        weekId: existing.week_id,
        tracks: updatedTracks,
        savedToLibrary: existing.saved_to_library,
        generatedAt: existing.generated_at
    };
};

export const markDiscoverySaved = async (userId: string, weekId: string) => {
    await supabase
        .from('weekly_discovery')
        .update({ saved_to_library: true })
        .eq('user_id', userId)
        .eq('week_id', weekId);
};