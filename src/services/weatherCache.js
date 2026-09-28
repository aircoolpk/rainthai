// =========================================================
// Weather Cache — 5-minute Interval Caching
// =========================================================
// เก็บผลลัพธ์ของ fetchAllProvinces() พร้อม timestamp
// - ถ้ายังไม่ครบ 5 นาที → คืน cache เดิม (ไม่ยิง API)
// - ถ้าครบ 5 นาที → fetch ใหม่ → cache ใหม่ → คืนค่า
//
// ผูกกับ supabase (incidents) แยก — incidents real-time ไม่ขึ้นกับ cache นี้

import { fetchAllProvinces } from './weatherService'
import { THAI_PROVINCES } from '../data/provinces'
import { BKK_DISTRICTS, PERIMETER_PROVINCES } from '../data/bangkok'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// รายชื่อ "ทุกเขตในกทม. + ปริมณฑล" — ตามที่ requirement สั่ง
const ALL_DISTRICTS_RAW = [
  ...BKK_DISTRICTS.map((d) => ({
    id: d.id, name: d.name, lat: d.lat, lon: d.lon, region: 'กรุงเทพมหานคร', parentId: 'bkk',
  })),
  ...PERIMETER_PROVINCES.flatMap((p) =>
    p.amphure.map((a) => ({
      id: a.id, name: a.name, lat: a.lat, lon: a.lon, region: p.name, parentId: p.id,
    })),
  ),
]

// in-memory cache
let _cache = null
//   _cache = { data: ProvinceWeather[], timestamp: number }
// หรือ null = ยังไม่เคย fetch

/**
 * ดึงข้อมูล weather + rain ของ "ทุกเขตในกทม. + ปริมณฑล"
 * @param {{ force?: boolean }} opts - force=true จะข้าม cache TTL (default: ใช้ cache ถ้ายังไม่หมดอายุ)
 * @returns {Promise<{ data: any[], timestamp: number, fromCache: boolean }>}
 */
export async function getAllDistrictsWeather({ force = false } = {}) {
  const now = Date.now()
  // 1) ถ้ามี cache และยังไม่หมดอายุ → คืน cache
  if (!force && _cache && now - _cache.timestamp < CACHE_TTL_MS) {
    return { data: _cache.data, timestamp: _cache.timestamp, fromCache: true }
  }

  // 2) Fetch ใหม่ — map ALL_DISTRICTS_RAW เป็น shape ที่ fetchProvinceWeather ใช้
  const provinces = ALL_DISTRICTS_RAW.map((d) => ({
    id: d.id, name: d.name, lat: d.lat, lon: d.lon, region: d.region,
  }))
  let data
  try {
    data = await fetchAllProvinces(provinces)
  } catch (e) {
    // ถ้า fetch fail → ถ้ามี cache เก่า → คืน cache เก่าแทน (stale-while-revalidate)
    if (_cache) {
      console.warn('[weatherCache] fetch failed, using stale cache:', e?.message)
      return { data: _cache.data, timestamp: _cache.timestamp, fromCache: true }
    }
    throw e
  }
  // เพิ่ม amphure/parentId กลับเข้าไปในแต่ละ item (เผื่อ UI ต้องใช้)
  const merged = data.map((item, idx) => ({
    ...item,
    parentId: ALL_DISTRICTS_RAW[idx]?.parentId,
    amphure: ALL_DISTRICTS_RAW[idx]?.amphure || undefined,
  }))

  _cache = { data: merged, timestamp: now }
  return { data: merged, timestamp: now, fromCache: false }
}

/**
 * Force refresh — ล้าง cache แล้ว fetch ใหม่
 */
export async function refreshAllDistrictsWeather() {
  return getAllDistrictsWeather({ force: true })
}

/**
 * ดูเวลา age ของ cache (ms) — ใช้แสดง "updated X นาทีที่แล้ว"
 */
export function getCacheAgeMs() {
  if (!_cache) return Infinity
  return Date.now() - _cache.timestamp
}

/**
 * Reset cache (สำหรับ dev/testing)
 */
export function resetWeatherCache() {
  _cache = null
}

export const WEATHER_CACHE_TTL_MS = CACHE_TTL_MS