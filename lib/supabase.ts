import { createClient } from '@supabase/supabase-js';

// Safe environment variable retrieval helper
const getEnv = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || fallback;
    }
  } catch (e) {
    // Ignore errors in strict environments
  }
  return fallback;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://kdfomfbxmdorteoqnwkf.supabase.co');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_9OkZCXJYS1AQfd5ISYbbOg_GKiOZirF');

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