import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// NOTE: This project does not ship generated Supabase Database types.
// Without those generics, supabase-js may infer table rows as `never` and
// break TypeScript builds in Next.js. We intentionally type the client as `any`
// to keep the app building until proper generated types are introduced.
let supabaseInstance: any | null = null

export function getSupabaseClient(): any {
  if (!supabaseInstance) {
    const config = env.getConfig()
    
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('Supabase configuration missing. Check your .env.local file.')
    }

    supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'X-Client-Info': `beatmap/${config.appVersion}`
        }
      }
    })
  }
  return supabaseInstance
}

export const supabase: any = getSupabaseClient()

export const spotifyConfig = {
  get clientId(): string {
    const config = env.getConfig()
    return config.spotifyClientId || ''
  },
  scopes: [
    'user-read-email',
    'user-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read',
    'user-top-read',
    'ugc-image-upload'
  ]
}

export async function checkSupabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const client = getSupabaseClient()
    const { error } = await client.from('playlists').select('id').limit(1)
    
    if (error) {
      return { healthy: false, error: error.message }
    }
    
    return { healthy: true }
  } catch (error) {
    return { healthy: false, error: String(error) }
  }
}
