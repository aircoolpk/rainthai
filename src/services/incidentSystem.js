// =========================================================
// Incident Reporting System — ผู้ใช้แจ้งเหตุน้ำท่วม
// =========================================================
// เก็บใน localStorage พร้อม vote + auto-clean 7 วัน
import { severityFromWaterLevel } from '../data/bangkok'

const KEY = 'rainthai.incidents.v1'

export function loadIncidents() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveIncidents(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
}

// Seed ตัวอย่าง 3 รายการ (ใช้ครั้งแรก)
export function seedIncidents() {
  const existing = loadIncidents()
  if (existing.length > 0) return existing

  const now = Date.now()
  const seeds = [
    {
      id: 'inc-seed-1',
      province: 'bkk',
      district: 'bkk-rkl',
      amphure: 'เขตร่มเกล้า',
      tambon: 'แขวงคลองสามวา',
      road: 'ถนนร่มเกล้า ซอย 12',
      waterLevelCm: 100,
      note: 'น้ำท่วมสูงระดับอก รถเล็กผ่านไม่ได้',
      reporter: 'สมชาย',
      phone: '081-222-3333',
      anonymous: false,
      lat: 13.7600,
      lon: 100.7350,
      submittedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
      votes: { up: 8, down: 0 },
      userVoted: null,
      status: 'active',
    },
    {
      id: 'inc-seed-2',
      province: 'bkk',
      district: 'bkk-jtc',
      amphure: 'เขตจตุจักร',
      tambon: 'แขวงลาดยาว',
      road: 'ถนนวิภาวดีรังสิต',
      waterLevelCm: 65,
      note: 'น้ำท่วมระดับเอว สัญจรลำบาก',
      reporter: null,
      phone: null,
      anonymous: true,
      lat: 13.8150,
      lon: 100.5680,
      submittedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(now - 30 * 60 * 1000).toISOString(),
      votes: { up: 12, down: 1 },
      userVoted: null,
      status: 'active',
    },
    {
      id: 'inc-seed-3',
      province: 'bkk',
      district: 'bkk-bkc',
      amphure: 'เขตบางแค',
      tambon: 'แขวงบางแค',
      road: 'ซอยบางแค 23',
      waterLevelCm: 35,
      note: 'น้ำท่วมระดับหัวเข่า รถเล็กควรระวัง',
      reporter: 'วิชัย',
      phone: '089-111-2222',
      anonymous: false,
      lat: 13.7050,
      lon: 100.4100,
      submittedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      votes: { up: 4, down: 0 },
      userVoted: null,
      status: 'active',
    },
  ]
  saveIncidents(seeds)
  return seeds
}

// เพิ่ม incident ใหม่
export function addIncident(payload) {
  const list = loadIncidents()
  const now = new Date().toISOString()
  const meta = severityFromWaterLevel(payload.waterLevelCm)
  const item = {
    id: `inc-${Date.now()}`,
    status: 'active',
    submittedAt: now,
    lastActivityAt: now,
    votes: { up: 0, down: 0 },
    userVoted: null,
    severity: meta.severity,
    severityLabel: meta.label,
    ...payload,
  }
  list.unshift(item)
  saveIncidents(list)
  return item
}

// Upvote / Downvote (toggle)
export function voteIncident(id, type) {
  const list = loadIncidents()
  const idx = list.findIndex((x) => x.id === id)
  if (idx === -1) return null
  const cur = list[idx]
  if (cur.userVoted === type) {
    cur.votes[type] = Math.max(0, cur.votes[type] - 1)
    cur.userVoted = null
  } else {
    if (cur.userVoted) {
      cur.votes[cur.userVoted] = Math.max(0, cur.votes[cur.userVoted] - 1)
    }
    cur.votes[type] = (cur.votes[type] || 0) + 1
    cur.userVoted = type
  }
  cur.lastActivityAt = new Date().toISOString()
  list[idx] = cur
  saveIncidents(list)
  return cur
}

// Auto-Clean: ลบ incidents ที่ lastActivityAt นานเกิน 7 วัน และ
// ตรวจกับ API weather data (ถ้า rain24h < 5 mm ในรัศมี ~0.05° → ไม่มีฝนสะสม)
export function autoCleanIncidents(incidents, weatherByDistrict = {}) {
  const now = Date.now()
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
  const removedIds = []

  const filtered = incidents.filter((i) => {
    if (i.status === 'removed') return false
    const age = now - new Date(i.lastActivityAt).getTime()
    if (age < SEVEN_DAYS) return true

    // ตรวจ weather API ของเขตที่ incident อยู่
    const weather = weatherByDistrict[i.district]
    const rainNow = weather?.rain24h ?? weather?.accumulated24h ?? null
    // ถ้า rain < 5 mm = ไม่มีฝน → ลบ
    if (rainNow !== null && rainNow < 5) {
      removedIds.push(i.id)
      return false
    }
    // ถ้าไม่มีข้อมูล weather → เก็บไว้ก่อน
    return true
  })

  if (removedIds.length > 0) saveIncidents(filtered)
  return { filtered, removedIds }
}

// ลบ incident ด้วย id
export function removeIncident(id) {
  const list = loadIncidents().filter((x) => x.id !== id)
  saveIncidents(list)
  return list
}

// Countdown waiting duration (X วัน Y ชั่วโมง)
export function waitingDurationLong(reportedAt) {
  const diffMs = Date.now() - new Date(reportedAt).getTime()
  if (diffMs < 0) return 'เพิ่งแจ้ง'
  const totalMin = Math.floor(diffMs / (60 * 1000))
  const d = Math.floor(totalMin / (60 * 24))
  const h = Math.floor((totalMin % (60 * 24)) / 60)
  const m = totalMin % 60
  const parts = []
  if (d > 0) parts.push(`${d} วัน`)
  if (h > 0) parts.push(`${h} ชม.`)
  if (m > 0 && d === 0) parts.push(`${m} นาที`)
  return parts.join(' ') || 'เพิ่งแจ้ง'
}