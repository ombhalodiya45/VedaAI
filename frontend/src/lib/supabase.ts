import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  if (!supabaseUrl || !supabaseUrl.startsWith('https://') || !supabaseKey || supabaseKey.includes('your_supabase') || supabaseKey.length < 20) {
    throw new Error(
      'Supabase is not configured. Open frontend/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project settings.'
    );
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
}

export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    supabaseKey &&
    supabaseKey.length > 20 &&
    !supabaseKey.includes('your_supabase')
  );
}
