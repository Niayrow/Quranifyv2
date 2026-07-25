import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export type QuranifyPlaybackRow = {
  user_id: string;
  reciter_id: number;
  moshaf_id: number;
  surah_id: number;
  position_seconds: number;
  updated_at: string;
};

export type QuranifyFavoriteRow = {
  user_id: string;
  reciter_id: number;
  created_at: string;
};

export type QuranifyProfileRow = {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};
