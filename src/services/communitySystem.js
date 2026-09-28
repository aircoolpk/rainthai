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

// Seed เริ่มต้น — แปลงจาก SOS_REPORTS mockup + เพิ่ม auto-expire
export function seedSOSCases() {
  const existing = loadSOSCases()
  if (existing.length > 0) return existing

  const now = Date.now()
  const seed = [
    // ค่าเก่าเกิน 24 ชม. (auto-resolved)
    {
      id: 'sos-old-1',
      lat: 13.76, lon: 100.50,
      name: 'น้ำท่วมบ้านพักอาศัย (เก่า)',
      people: 3, contact: '081-111-2222',
      district: 'bkk-pkn',
      note: 'เคสเก่าเกิน 24 ชม. รอการยืนยัน',
      reportedAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      status: 'auto-resolved',
    },
    // เคส 2 ชั่วโมงก่อน
    {
      id: 'sos-recent-1',
      lat: 13.7600, lon: 100.7350,
      name: 'ผู้ประสบภัยติดอยู่ในบ้าน',
      people: 4, contact: '081-234-5678',
      district: 'bkk-rkl',
      note: 'น้ำท่วมสูงถึงชั้น 2 ต้องการเรือช่วยเหลือด่วน',
      reportedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
    // เคส 30 นาทีก่อน
    {
      id: 'sos-recent-2',
      lat: 13.8150, lon: 100.5680,
      name: 'รถจมน้ำ-ติดในรถ',
      people: 1, contact: '086-555-1234',
      district: 'bkk-jtc',
      note: 'รถติดอยู่กลางถนนวิภาวดีฯ น้ำท่วมครึ่งคัน',
      reportedAt: new Date(now - 30 * 60 * 1000).toISOString(),
      status: 'active',
    },
  ]
  saveSOSCases(seed)
  return seed
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