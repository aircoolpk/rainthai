import { THAI_PROVINCES } from '../data/provinces'

// ดึงข้อมูลสภาพอากาศ + ปริมาณฝนรายชั่วโมง + ฝนสะสม 24 ชม. จาก Open-Meteo
// หมายเหตุ: หน่วย precipitation ที่ใช้คือ millimeters
const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

// =========================================================
// Rate-limit safety knobs
// =========================================================
// จำกัดจำนวน concurrent requests ไป Open-Meteo — ป้องกัน 429 burst
const MAX_CONCURRENT = 4
// Retry config สำหรับ 429 / network errors
const MAX_RETRIES        = 2
const INITIAL_BACKOFF_MS = 1500  // 1.5s → 3s → 6s (exponential)
// Minimum interval ระหว่าง request ติดๆ (global throttle)
const MIN_REQUEST_GAP_MS = 250

let _activeCount  = 0
let _nextSlotAt   = 0
const _waitQueue  = []

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * รอจนกว่าจะมี "slot" ว่าง (concurrent < MAX_CONCURRENT) และถึงเวลา throttle
 * — ใช้คิวแทนการ fire พร้อมกัน เพื่อกัน 429 burst
 */
async function acquireSlot() {
  // 1) Throttle — เว้นช่องว่างอย่างน้อย MIN_REQUEST_GAP_MS ระหว่าง request
  const now = Date.now()
  if (_nextSlotAt > now) {
    await sleep(_nextSlotAt - now)
  }
  _nextSlotAt = Date.now() + MIN_REQUEST_GAP_MS

  // 2) Concurrency gate — ถ้าเต็ม ให้รอคิว
  if (_activeCount >= MAX_CONCURRENT) {
    await new Promise((resolve) => _waitQueue.push(resolve))
  }
  _activeCount += 1
}

function releaseSlot() {
  _activeCount = Math.max(0, _activeCount - 1)
  const next = _waitQueue.shift()
  if (next) next()
}

/**
 * Parse "Retry-After" header (seconds หรือ HTTP date) → ms
 * คืน null ถ้า parse ไม่ได้
 */
function parseRetryAfter(value) {
  if (!value) return null
  const asInt = parseInt(value, 10)
  if (!Number.isNaN(asInt) && String(asInt) === String(value).trim()) {
    return asInt * 1000
  }
  const dateMs = Date.parse(value)
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now())
  }
  return null
}

/**
 * ดึงข้อมูลฝนสำหรับจังหวัดเดียว — พร้อม 429-aware retry
 * @throws {Error} rate_limited | network | http_<status>
 */
export async function fetchProvinceWeather(province) {
  const params = new URLSearchParams({
    latitude: province.lat,
    longitude: province.lon,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
    ].join(','),
    hourly: 'precipitation',
    forecast_days: 1,
    timezone: 'Asia/Bangkok',
  })

  const url = `${BASE_URL}?${params.toString()}`

  let lastError = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    await acquireSlot()
    let res
    try {
      res = await fetch(url)
    } catch (e) {
      releaseSlot()
      lastError = new Error(`network: ${e?.message || 'fetch failed'}`)
    } finally {
      // releaseSlot ถูกเรียกใน try/catch ด้านบนแล้ว — ปลอดภัย
    }
    // กรณี fetch throw แต่อยู่นอก try/catch ให้ rethrow
    // (โค้ดข้างบน releaseSlot ไปแล้ว — ป้องกัน slot ค้าง)

    // ถ้า fetch สำเร็จ (res defined)
    if (res !== undefined) {
      if (res.ok) {
        releaseSlot()
        try {
          const data = await res.json()
          return shapeWeather(province, data)
        } catch (e) {
          throw new Error(`parse: ${e?.message || 'invalid json'}`)
        }
      }

      releaseSlot()

      // 429 → รอ Retry-After (ถ้ามี) แล้วลองใหม่
      if (res.status === 429) {
        const retryAfterMs = parseRetryAfter(res.headers.get('Retry-After'))
        const backoff = retryAfterMs !== null
          ? retryAfterMs
          : INITIAL_BACKOFF_MS * Math.pow(2, attempt)
        const err = new Error(`Open-Meteo 429 Too Many Requests (attempt ${attempt + 1}/${MAX_RETRIES + 1})`)
        err.status = 429
        err.retryAfterMs = backoff
        lastError = err
        if (attempt < MAX_RETRIES) {
          console.warn(`[weatherService] 429 on ${province.id}, backing off ${backoff}ms`)
          await sleep(backoff)
          continue
        }
        throw err
      }

      // 5xx → retry ด้วย exponential backoff
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt)
        lastError = new Error(`Open-Meteo ${res.status}`)
        lastError.status = res.status
        console.warn(`[weatherService] ${res.status} on ${province.id}, backing off ${backoff}ms`)
        await sleep(backoff)
        continue
      }

      // 4xx (อื่นๆ) — ไม่ retry
      throw new Error(`Open-Meteo ${res.status}`)
    }

    // กรณี network error → retry
    if (attempt < MAX_RETRIES) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt)
      console.warn(`[weatherService] network on ${province.id}, backing off ${backoff}ms`)
      await sleep(backoff)
      continue
    }
  }

  throw lastError || new Error('Open-Meteo: unknown failure')
}

/**
 * ดึงข้อมูลฝนสำหรับหลายจังหวัดพร้อมกัน (throttled + parallel)
 * — ใช้ Promise.allSettled → province ที่ fail จะไม่ทำให้ทั้งก้อนพัง
 * — แต่ละ province ยังมี per-call retry/backoff ของตัวเอง
 */
export async function fetchAllProvinces(provinces = THAI_PROVINCES) {
  if (!Array.isArray(provinces) || provinces.length === 0) return []

  const settled = await Promise.allSettled(
    provinces.map((p) => fetchProvinceWeather(p)),
  )
  return settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    const province = provinces[i]
    return {
      id: province.id,
      name: province.name,
      lat: province.lat,
      lon: province.lon,
      region: province.region,
      amphure: province.amphure || [],
      error: r.reason?.message || 'fetch failed',
      _status: r.reason?.status || null,
    }
  })
}

// ----- helpers -----

function shapeWeather(province, data) {
  const current = data.current || {}
  const hourly  = data.hourly || {}

  let accumulated24h = 0
  if (Array.isArray(hourly.precipitation)) {
    accumulated24h = hourly.precipitation
      .slice(0, 24)
      .reduce((s, v) => s + (Number(v) || 0), 0)
  }

  const level = rainLevel(accumulated24h)

  return {
    id: province.id,
    name: province.name,
    lat: province.lat,
    lon: province.lon,
    region: province.region,
    amphure: province.amphure || [],
    temperature: current.temperature_2m ?? null,
    humidity: current.relative_humidity_2m ?? null,
    precipitation: current.precipitation ?? 0,
    weatherCode: current.weather_code ?? null,
    windSpeed: current.wind_speed_10m ?? null,
    accumulated24h: Number(accumulated24h.toFixed(1)),
    level,
    fetchedAt: new Date().toISOString(),
  }
}

export function rainLevel(mmPerDay) {
  if (mmPerDay >= 35) return 'danger'
  if (mmPerDay >= 10) return 'moderate'
  return 'safe'
}

export const LEVEL_META = {
  safe:     { label: 'ปกติ',                color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', chart: '#10B981' },
  moderate: { label: 'ฝนปานกลาง',          color: '#F59E0B', bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   chart: '#F59E0B' },
  danger:   { label: 'ฝนหนัก/เสี่ยงน้ำท่วม', color: '#EF4444', bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500',     chart: '#EF4444' },
}

export function weatherCodeLabel(code) {
  const map = {
    0: 'ท้องฟ้าแจ่มใส', 1: 'มีเมฆบางส่วน', 2: 'มีเมฆเป็นส่วนใหญ่', 3: 'มืดครึ้ม',
    45: 'หมอก', 48: 'หมอกน้ำแข็ง',
    51: 'ฝนปรอยเบาๆ', 53: 'ฝนปรอยปานกลาง', 55: 'ฝนปรอยหนัก',
    61: 'ฝนเบา', 63: 'ฝนปานกลาง', 65: 'ฝนหนัก',
    71: 'หิมะตกเบา', 73: 'หิมะตกปานกลาง', 75: 'หิมะตกหนัก',
    80: 'ฝนเป็นช่วงๆ เบา', 81: 'ฝนเป็นช่วงๆ ปานกลาง', 82: 'ฝนเป็นช่วงๆ หนัก',
    95: 'พายุฝนฟ้าคะนอง', 96: 'พายุฝนฟ้าคะนอง + ลูกเห็บเล็ก', 99: 'พายุฝนฟ้าคะนอง + ลูกเห็บใหญ่',
  }
  return map[code] || 'ไม่ทราบ'
}

// ---------- Mockup derived data ----------
// สร้าง mockup ค่าฝน + ระดับความเสี่ยงของอำเภอ/ตำบล จากค่าจังหวัด
export function deriveAmphureMock(provinceWeather) {
  const p = provinceWeather
  if (p.error || !p.amphure) return []
  return p.amphure.map((a) => {
    // ใช้ค่าจังหวัด ± ความแปรปรวน
    const noise = (Math.random() - 0.5) * 8
    const mm = Math.max(0, p.accumulated24h + noise)
    return {
      ...a,
      accumulated24h: Number(mm.toFixed(1)),
      level: rainLevel(mm),
      temperature: p.temperature !== null
        ? Number((p.temperature + (Math.random() - 0.5) * 1.5).toFixed(1))
        : null,
    }
  })
}

export function deriveTambonMock(amphure) {
  return amphure.tambons.map((t, idx) => {
    const noise = (Math.random() - 0.5) * 5
    const mm = Math.max(0, amphure.accumulated24h + noise)
    return {
      ...t,
      amphureName: amphure.name,
      accumulated24h: Number(mm.toFixed(1)),
      level: rainLevel(mm),
    }
  })
}
