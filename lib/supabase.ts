import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kdfomfbxmdorteoqnwkf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9OkZCXJYS1AQfd5ISYbbOg_GKiOZirF';

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