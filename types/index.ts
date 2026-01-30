export interface User {
  id: string;
  email?: string;
  display_name?: string;
  images?: { url: string }[];
  product?: string;
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface Artist {
  id: string;
  name: string;
  genres?: string[];
  images?: SpotifyImage[];
  external_urls: { spotify: string };
}

export interface Album {
  id: string;
  name: string;
  artists: Artist[];
  images: SpotifyImage[];
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  total_tracks: number;
  album_type: 'album' | 'single' | 'compilation';
  external_urls: { spotify: string };
  uri: string;
  tracks?: {
    items: Track[];
  };
}

export interface Track {
  id: string;
  name: string;
  album?: Album;
  artists: Artist[];
  duration_ms: number;
  preview_url: string | null;
  uri: string;
  external_urls?: { spotify: string };
  popularity?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  tracks: {
    total: number;
  };
  external_urls: { spotify: string };
}

export type DateRangeType = 'day' | 'week' | 'month' | 'custom';
export type ContentType = 'albums' | 'tracks';
export type ViewMode = 'grid' | 'list';

export interface FilterState {
  search: string;
  dateRange: DateRangeType;
  customStartDate: string;
  customEndDate: string;
  genre: string;
  contentType: ContentType;
  viewMode: ViewMode;
}

export interface HistoryItem {
  id: string;
  playlistName: string;
  trackCount: number;
  createdAt: string;
  spotifyUrl: string;
}

export interface DbPlaylist {
  id: string;
  user_id: string;
  name: string;
  spotify_playlist_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbPlaylistTrack {
  id?: string;
  playlist_id: string;
  spotify_track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  duration_ms: number;
  genre: string | null;
  release_date: string;
  image_url: string;
}

export interface UserStats {
  totalPlaylists: number;
  totalTracksSaved: number;
  totalTimeMs: number;
  uniqueArtists: number;
  topGenres: { name: string; count: number; percent: number }[];
  activityByMonth: { month: string; playlists: number; tracks: number }[];
}

export interface TopArtistData {
  id: string;
  name: string;
  image: string;
  popularity: number;
  genres: string[];
  external_url: string;
}

export type NotificationType = 'release' | 'system' | 'recommendation';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  link?: string;
  image_url?: string;
}

export interface FollowedArtist {
  id: string;
  user_id: string;
  artist_id: string;
  artist_name: string;
  image_url: string;
  created_at: string;
}

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklySummary: boolean;
  notifyNewReleases: boolean;
}

export interface RecommendedTrack extends Track {
  reason: string;
  feedback?: 'like' | 'dislike' | null;
}

export interface WeeklyDiscovery {
  id: string;
  weekId: string;
  tracks: RecommendedTrack[];
  generatedAt: string;
  savedToLibrary: boolean;
}

export interface ThemeColors {
  bg: string;
  card: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  isCustom?: boolean;
}

export interface DbCustomTheme {
  id: string;
  user_id: string;
  name: string;
  colors: ThemeColors;
  created_at: string;
}

export type LayoutMode = 'grid-compact' | 'grid-normal' | 'list' | 'cards';
export type AppFontSize = 'small' | 'normal' | 'large';
export type AppDensity = 'compact' | 'normal' | 'expanded';
export type SidebarPosition = 'left' | 'right' | 'hidden';

export interface LayoutSettings {
  mode: LayoutMode;
  fontSize: AppFontSize;
  density: AppDensity;
  sidebarPosition: SidebarPosition;
}

export interface UserPreferencesRecord {
  user_id: string;
  theme_id: string;
  custom_theme_data: Theme | null;
  layout_settings: LayoutSettings;
  notification_settings: UserSettings;
}
