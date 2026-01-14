import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onjdwzfsqdwlhzwvuzei.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uamR3emZzcWR3bGh6d3Z1emVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MTE3MjksImV4cCI6MjA4Mzk4NzcyOX0.vNtQ2c0ZJyt8jQXmHiy30FZyBgMznYADAecOpzQsMFw';

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