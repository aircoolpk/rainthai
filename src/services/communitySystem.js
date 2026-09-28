// =========================================================
// ระบบรีวิวรายงาน (Community Verification) + Auto-Expire
// =========================================================
// ใช้้ localStorage สำหรับเก็บ votes + corrections ของผู้ใช้ (mockup)
// เคส SOS ใช้้ in-memory store + auto-expire 24 ชม.

const VOTES_KEY    = 'rainthai.votes.v1'
const CORRECTIONS_KEY = 'rainthai.corrections.v1'

// =========================================================
// VOTES — เก็บการโหวตของผู้ใช้
// { reportId: { up: number, down: number, userVoted: 'up'|'down'|null } }
// =========================================================
export function loadVotes() {
  try {
    const raw = localStorage.getItem(VOTES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveVotes(votes) {
  try { localStorage.setItem(VOTES_KEY, JSON.stringify(votes)) } catch {}
}

export function voteReport(reportId, type /* 'up' | 'down' */) {
  const votes = loadVotes()
  const cur = votes[reportId] || { up: 0, down: 0, userVoted: null }
  // toggle ถ้า user เคยโหวตอยู่แล้ว
  if (cur.userVoted === type) {
    cur[type] = Math.max(0, cur[type] - 1)
    cur.userVoted = null
  } else {
    if (cur.userVoted) {
      cur[cur.userVoted] = Math.max(0, cur[cur.userVoted] - 1)
    }
    cur[type] += 1
    cur.userVoted = type
  }
  votes[reportId] = cur
  saveVotes(votes)
  return cur
}

// =========================================================
// CORRECTIONS — ข้อมูลแก้ไขที่ user ส่งมา
// { reportId: [ { id, waterLevel, note, submittedAt } ] }
// =========================================================
export function loadCorrections() {
  try {
    const raw = localStorage.getItem(CORRECTIONS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveCorrections(c) {
  try { localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(c)) } catch {}
}

export function addCorrection(reportId, correction) {
  const all = loadCorrections()
  if (!all[reportId]) all[reportId] = []
  all[reportId].unshift({
    id: `cor-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    ...correction,
  })
  saveCorrections(all)
  return all[reportId]
}

// =========================================================
// SOS Cases — in-memory store with auto-expire 24h
// =========================================================
const SOS_STORE_KEY = 'rainthai.sos.cases.v1'

export function loadSOSCases() {
  try {
    const raw = localStorage.getItem(SOS_STORE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSOSCases(cases) {
  try { localStorage.setItem(SOS_STORE_KEY, JSON.stringify(cases)) } catch {}
}

// Seed เริ่มต้น — ไม่มี mockup (ดึงเฉพาะเคสจริงจากผู้ใช้)
// ล้าง localStorage เก่าที่อาจมี mockup ค้างไว้ (migrate)
export function seedSOSCases() {
  try {
    const existing = loadSOSCases()
    // ถ้า localStorage มีแต่เป็น mockup เดิม → ลบทิ้ง
    const onlyMocks = existing.length > 0 && existing.every((c) =>
      ['sos-old-1', 'sos-recent-1', 'sos-recent-2'].includes(c.id)
    )
    if (onlyMocks) {
      try { localStorage.removeItem(SOS_STORE_KEY) } catch {}
      return []
    }
    return Array.isArray(existing) ? existing : []
  } catch {
    return []
  }
}

// Auto-resolve เคสเกิน 24 ชม. ตาม Logic
export function applyAutoExpire(cases) {
  const now = Date.now()
  const AUTO_EXPIRE_MS = 24 * 60 * 60 * 1000
  let changed = false
  const updated = cases.map((c) => {
    if (c.status === 'active' || c.status === 'resolved') {
      const age = now - new Date(c.reportedAt).getTime()
      if (c.status === 'active' && age > AUTO_EXPIRE_MS) {
        changed = true
        return { ...c, status: 'auto-resolved', expiredAt: new Date().toISOString() }
      }
    }
    return c
  })
  if (changed) saveSOSCases(updated)
  return updated
}

// นับเวลารอ "X ชั่วโมง Y นาที"
export function waitingDuration(reportedAt) {
  const diffMs = Date.now() - new Date(reportedAt).getTime()
  if (diffMs < 0) return 'เพิ่งแจ้ง'
  const totalMin = Math.floor(diffMs / (60 * 1000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} นาที`
  if (m === 0) return `${h} ชั่วโมง`
  return `${h} ชั่วโมง ${m} นาที`
}

// Helper: filter เคสที่ยัง active (ไม่รวม auto-resolved/resolved)
export function activeSOS(cases) {
  return cases.filter((c) => c.status === 'active')
}

// Helper: เคสที่ auto-resolved (เกิน 24 ชม.)
export function expiredSOS(cases) {
  return cases.filter((c) => c.status === 'auto-resolved')
}

// Helper: ตรวจว่าเคสใกล้ครบ 24 ชม. หรือยัง (ใช้แจ้งเตือน "กดส่งขอฯ ใหม่อีกครั้ง")
export function isNearExpire(reportedAt, thresholdHours = 20) {
  const age = Date.now() - new Date(reportedAt).getTime()
  return age >= thresholdHours * 60 * 60 * 1000
}