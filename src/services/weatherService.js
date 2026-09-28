import { THAI_PROVINCES } from '../data/provinces'

// ดึงข้อมูลสภาพอากาศ + ปริมาณฝนรายชั่วโมง + ฝนสะสม 24 ชม. จาก Open-Meteo
// หมายเหตุ: หน่วย precipitation ที่ใช้คือ millimeters
const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

/**
 * ดึงข้อมูลฝนสำหรับจังหวัดเดียว
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
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`)
  const data = await res.json()
  return shapeWeather(province, data)
}

/**
 * ดึงข้อมูลฝนสำหรับหลายจังหวัดพร้อมกัน
 */
export async function fetchAllProvinces(provinces = THAI_PROVINCES) {
  const settled = await Promise.allSettled(
    provinces.map((p) => fetchProvinceWeather(p)),
  )
  return settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return {
      id: provinces[i].id,
      name: provinces[i].name,
      lat: provinces[i].lat,
      lon: provinces[i].lon,
      region: provinces[i].region,
      amphure: provinces[i].amphure || [],
      error: r.reason?.message || 'fetch failed',
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