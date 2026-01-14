import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const supabaseUrl = process.env.SUPABASE_URL || 'https://kdfomfbxmdorteoqnwkf.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'SUA_ANON_KEY_AQUI';

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