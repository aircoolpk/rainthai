// =========================================================
// Authentication System (Mockup) — localStorage based
// =========================================================
// ไม่มี backend — เก็บ user list ใน localStorage
// ใช้สำหรับ gating SOS / Incident Report / SOS case ownership

const USERS_KEY    = 'rainthai.users.v1'
const SESSION_KEY = 'rainthai.session.v1'

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ----- Users -----
export function loadUsers() {
  return read(USERS_KEY) || []
}
export function saveUsers(users) {
  write(USERS_KEY, users)
}

// Seed user เริ่มต้น (ถ้ายังไม่มี)
export function seedDefaultUsers() {
  const existing = loadUsers()
  if (existing.length > 0) return existing
  const seed = [
    { id: 'u-demo', username: 'demo',   displayName: 'ผู้ใช้ทดสอบ',  phone: '081-111-1111', createdAt: new Date().toISOString() },
    { id: 'u-guest', username: 'guest', displayName: 'Guest',           phone: '089-000-0000', createdAt: new Date().toISOString() },
  ]
  saveUsers(seed)
  return seed
}

// ----- Register -----
export function registerUser({ username, displayName, phone }) {
  const users = loadUsers()
  const trimmed = (username || '').trim()
  if (!trimmed) throw new Error('กรุณากรอกชื่อผู้ใช้')
  if (users.some((u) => u.username.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('มีชื่อผู้ใช้นี้อยู่แล้ว')
  }
  const user = {
    id: `u-${Date.now()}`,
    username: trimmed,
    displayName: (displayName || trimmed).trim(),
    phone: (phone || '').trim(),
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  saveUsers(users)
  return user
}

// ----- Login -----
// (Mockup — ไม่มี password; ตรวจแค่ username ตรงกัน)
export function login(username) {
  const users = loadUsers()
  const u = users.find((x) => x.username.toLowerCase() === (username || '').trim().toLowerCase())
  if (!u) throw new Error('ไม่พบชื่อผู้ใช้นี้')
  write(SESSION_KEY, { userId: u.id, loggedInAt: new Date().toISOString() })
  return u
}

// ----- Session -----
export function loadSession() {
  const s = read(SESSION_KEY)
  if (!s) return null
  const users = loadUsers()
  return users.find((u) => u.id === s.userId) || null
}

export function logout() {
  try { localStorage.removeItem(SESSION_KEY) } catch {}
}

// ----- Owner check -----
// ใช้ตรวจว่า case นี้ user นี้เป็นเจ้าของหรือไม่
export function isOwner(caseItem, user) {
  if (!user || !caseItem) return false
  if (caseItem.createdBy === user.id) return true
  if (caseItem.createdByUsername && caseItem.createdByUsername === user.username) return true
  return false
}