// =========================================================
// Supabase Auth Service — Google OAuth + Session
// =========================================================
// Wraps supabase.auth for: signInWithGoogle, signOut, getSession, onAuthChange
import { supabase } from './supabaseClient'

const AUTH_USERS_KEY = 'rainthai.supabase.user.v1'

// ----- Sign in with Google OAuth -----
export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}${window.location.pathname}`
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  if (error) throw error
  return data
}

// ----- Sign out -----
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  try { localStorage.removeItem(AUTH_USERS_KEY) } catch {}
}

// ----- Get current session -----
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

// ----- Listen to auth changes -----
export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return subscription
}

// ----- Shape supabase session -> app user -----
// Maps a supabase session.user to a flat "user" object used by the rest of the app.
export function sessionToUser(session) {
  if (!session || !session.user) return null
  const u = session.user
  const meta = u.user_metadata || {}
  return {
    id: u.id,
    username: (meta.preferred_username || meta.name || u.email || '').split('@')[0] || 'user',
    displayName: meta.full_name || meta.name || (u.email || '').split('@')[0] || 'User',
    email: u.email || '',
    avatarUrl: meta.avatar_url || meta.picture || '',
    phone: meta.phone || u.phone || '',
    provider: (u.identities && u.identities[0]?.provider) || 'google',
    raw: u,
    session,
  }
}

// ----- Persist current user snapshot to localStorage (for offline read) -----
export function persistUser(user) {
  if (user) localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(user))
  else localStorage.removeItem(AUTH_USERS_KEY)
}

export function loadPersistedUser() {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}