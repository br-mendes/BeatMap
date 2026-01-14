import { createClient } from '@supabase/supabase-js';

// Configuration for Vite environment
// Safely access env to prevent runtime errors if import.meta.env is undefined
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://kdfomfbxmdorteoqnwkf.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9OkZCXJYS1AQfd5ISYbbOg_GKiOZirF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const spotifyConfig = {
  clientId: 'e191707f69814495a5c650de3a265109',
  scopes: [
    'user-read-email',
    'user-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read',
    'user-top-read'
  ]
};