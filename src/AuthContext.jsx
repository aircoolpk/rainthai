import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  getSession,
  onAuthChange,
  signOut as supabaseSignOut,
  signInWithGoogle,
  sessionToUser,
  persistUser,
  loadPersistedUser,
} from './services/supabaseAuth'

// =========================================================
// AuthContext — tracks current supabase user; keeps local fallback for offline
// =========================================================
const AuthContext = createContext({ user: null, signOut: () => {}, signInGoogle: () => {} })

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadPersistedUser())
  const [loading, setLoading] = useState(true)

  // Initial session check + listener
  useEffect(() => {
    let mounted = true
    let supaSub = null

    const init = async () => {
      try {
        const session = await getSession()
        if (!mounted) return
        const u = sessionToUser(session)
        setUser(u)
        persistUser(u)
      } catch {
        // ignore — keep cached user
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()

    // Subscribe to changes (signin / signout / token refresh)
    const { data } = onAuthChange((event, session) => {
      const u = sessionToUser(session)
      setUser(u)
      persistUser(u)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setLoading(false)
      }
    })
    supaSub = data?.subscription

    return () => {
      mounted = false
      try { supaSub?.unsubscribe() } catch {}
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabaseSignOut()
    } catch {
      // ignore — still clear local state
    }
    setUser(null)
    persistUser(null)
  }, [])

  const signInGoogle = useCallback(async () => {
    await signInWithGoogle()
    // supabase will redirect → on return, onAuthChange fires and updates user
  }, [])

  const value = { user, loading, signOut, signInGoogle, setUser }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}