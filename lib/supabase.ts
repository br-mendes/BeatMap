import { createSupabaseBrowserClient } from './supabase/browser'

// Single client instance for the browser.
let supabaseInstance: any | null = null

export function getSupabaseClient(): any {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseBrowserClient()
  }
  return supabaseInstance
}

export const supabase: any = getSupabaseClient()

export default supabase
