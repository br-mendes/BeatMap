import { supabase } from './supabase';
import { DbPlaylist, DbPlaylistTrack, HistoryItem, Track, Album } from '../types';

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
            genre: genreContext || album.artists[0].genres?.[0] || null, // Best effort genre
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