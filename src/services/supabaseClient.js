// =========================================================
// Supabase Client — Singleton
// =========================================================
// Auth uses Supabase localStorage for session persistence (default).
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hzrndgjmfsllteiiksfu.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cm5kZ2ptZnNsbHRlaWlrc2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1OTAxMTcsImV4cCI6MjEwNjE2NjExN30.xfT5PiExnkkfFD_-xsJfe_jEScBY66T_Jwu2uRHJB6U'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})