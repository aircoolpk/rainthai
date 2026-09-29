// =========================================================
// Weather Cache — Smart Client-Side Caching
// =========================================================
// ป้องกัน Open-Meteo 429 Too Many Requests ด้วยกลยุทธ์:
//   1) TTL ขยายเป็น 10 นาที (เดิม 5 นาที) — ลดจำนวน request 50%
//   2) forceRefresh=true ใช้สำหรับ manual refresh เท่านั้น (ปุ่ม "อัปเดตข้อมูลสด")
//   3) Stale-while-revalidate: ถ้า fetch fail → คืน cache เก่า (เลย TTL แล้วก็ตาม)
//   4) Cooldown: ถ้า fetch fail หรือได้ 429 → ห้าม fetch ซ้ำภายใน BACKOFF_COOLDOWN_MS
//      — กันการยิง API ซ้ำๆ จน rate limit หนักขึ้น
//   5) In-flight de-dup: ถ้ามี request กำลังวิ่งอยู่ → return Promise เดียวกัน (ไม่ยิงซ้อน)
//
// ผูกกับ supabase (incidents) แยก — incidents real-time ไม่ขึ้นกับ cache นี้

import { fetchAllProvinces } from './weatherService'
import { THAI_PROVINCES } from '../data/provinces'
import { BKK_DISTRICTS, PERIMETER_PROVINCES } from '../data/bangkok'

// =========================================================
// Provinces cache (ต่างจังหวัด)
// =========================================================
// แยกจาก districts cache เพราะ provinces มี 76 จังหวัด ต้องใช้ TTL ยาวกว่า
const PROVINCES_TTL_MS        = 15 * 60 * 1000 // 15 นาที — เพราะมี 76 จังหวัด
const PROVINCES_BACKOFF_MS    = 60 * 1000      // cooldown หลัง fetch fail

let _provincesCache = null
let _provincesCooldownUntil = 0
let _provincesInFlight = null

// ----- Cache config -----
const CACHE_TTL_MS          = 10 * 60 * 1000 // 10 minutes (per spec: 10-15 min)
const STALE_TTL_MS          = 30 * 60 * 1000 // 30 min — ยอมให้ใช้ cache แก่ได้ถึง 30 นาที
const BACKOFF_COOLDOWN_MS   = 60 * 1000      // 1 min — หลัง fetch fail/429 ห้ามลองใหม่ภายใน 1 นาที

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

// ----- in-memory cache -----
// Shape: { data, timestamp, lastError, lastErrorAt }
let _cache         = null
let _inFlight      = null // Promise (de-dup)
let _cooldownUntil = 0    // timestamp — ห้าม fetch จนถึงเวลานี้

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * ดึงข้อมูล weather + rain ของ "ทุกเขตในกทม. + ปริมณฑล"
 *
 * @param {{ force?: boolean, forceRefresh?: boolean }} opts
 *   - force=true (alias forceRefresh=true) → ข้าม cache TTL
 *     ใช้เฉพาะตอน user กดปุ่ม "อัปเดตข้อมูลสด" เท่านั้น
 *
 * @returns {Promise<{
 *   data: any[],
 *   timestamp: number,
 *   fromCache: boolean,
 *   stale: boolean,
 *   error?: string,
 * }>}
 */
export async function getAllDistrictsWeather(opts = {}) {
  const force = !!(opts.force || opts.forceRefresh)
  const now   = Date.now()

  // ----- (A) Cache hit ปกติ (อยู่ใน TTL) -----
  if (!force && _cache && now - _cache.timestamp < CACHE_TTL_MS) {
    return {
      data: _cache.data,
      timestamp: _cache.timestamp,
      fromCache: true,
      stale: false,
    }
  }

  // ----- (B) Cooldown — ถ้า fetch fail/429 ไปเมื่อกี้ ห้ามลองซ้ำ -----
  // ยกเว้น force=true (user กดปุ่ม refresh เอง → อนุญาตให้ bypass cooldown)
  if (!force && now < _cooldownUntil) {
    if (_cache) {
      const ageMs = now - _cache.timestamp
      return {
        data: _cache.data,
        timestamp: _cache.timestamp,
        fromCache: true,
        stale: ageMs >= CACHE_TTL_MS,
        error: _cache.lastError || 'cooldown',
      }
    }
    // ไม่มี cache เลย + ยังอยู่ใน cooldown → รอให้ cooldown จบ
    await sleep(_cooldownUntil - now)
  }

  // ----- (C) In-flight de-dup — ถ้ามี request กำลังวิ่งอยู่ ใช้ Promise เดียวกัน -----
  if (_inFlight) {
    try {
      return await _inFlight
    } catch {
      // ถ้า in-flight fail → fallthrough ไป cache ด้านล่าง
    }
  }

  // ----- (D) Fetch ใหม่ -----
  const fetchPromise = doFetch()
  _inFlight = fetchPromise

  try {
    const result = await fetchPromise
    return result
  } finally {
    _inFlight = null
  }

  async function doFetch() {
    const provinces = ALL_DISTRICTS_RAW.map((d) => ({
      id: d.id, name: d.name, lat: d.lat, lon: d.lon, region: d.region,
    }))

    let raw
    try {
      raw = await fetchAllProvinces(provinces)
    } catch (e) {
      // ----- (E) Fetch failed → cooldown + stale-while-revalidate -----
      _cooldownUntil = Date.now() + BACKOFF_COOLDOWN_MS
      console.warn('[weatherCache] fetch failed, entering cooldown:', e?.message)

      if (_cache) {
        return {
          data: _cache.data,
          timestamp: _cache.timestamp,
          fromCache: true,
          stale: true,
          error: e?.message || 'fetch failed',
        }
      }
      // ไม่มี cache เลย → คืน empty array + error (ไม่ throw เพื่อไม่ให้ UI พัง)
      return {
        data: [],
        timestamp: Date.now(),
        fromCache: false,
        stale: false,
        error: e?.message || 'fetch failed',
      }
    }

    // ----- (F) Merge กลับเข้ากับ parentId/amphure -----
    const merged = raw.map((item, idx) => ({
      ...item,
      parentId: ALL_DISTRICTS_RAW[idx]?.parentId,
      amphure: ALL_DISTRICTS_RAW[idx]?.amphure || undefined,
    }))

    // นับจำนวนที่ fail (มี .error) — ถ้า fail เกินครึ่ง → cache เป็น "degraded" แต่ยังเก็บ
    const failedCount = merged.filter((it) => it && it.error).length
    const isDegraded  = failedCount > merged.length / 2

    _cache = {
      data: merged,
      timestamp: Date.now(),
      lastError: isDegraded ? `${failedCount}/${merged.length} provinces failed` : null,
      lastErrorAt: isDegraded ? Date.now() : (_cache?.lastErrorAt || null),
    }

    return {
      data: merged,
      timestamp: _cache.timestamp,
      fromCache: false,
      stale: false,
      error: isDegraded ? _cache.lastError : undefined,
    }
  }
}

/**
 * Force refresh — ล้าง cache แล้ว fetch ใหม่ (ใช้กับปุ่ม "อัปเดตข้อมูลสด")
 * @param {{ bypassCooldown?: boolean }} opts
 *   - bypassCooldown=true → แม้จะอยู่ใน cooldown ก็ bypass (default: false)
 */
export async function refreshAllDistrictsWeather(opts = {}) {
  if (opts.bypassCooldown) {
    _cooldownUntil = 0
  }
  return getAllDistrictsWeather({ force: true })
}

// =========================================================
// getAllProvincesWeather — cache สำหรับ "ต่างจังหวัด" (76 จังหวัด)
// =========================================================
// TTL 15 นาที — ยาวกว่า districts เพราะมีจำนวน request มากกว่า
// กลยุทธ์เดียวกัน: stale-while-revalidate + cooldown + in-flight de-dup
export async function getAllProvincesWeather(opts = {}) {
  const force = !!(opts.force || opts.forceRefresh)
  const now   = Date.now()

  // (A) Cache hit ปกติ
  if (!force && _provincesCache && now - _provincesCache.timestamp < PROVINCES_TTL_MS) {
    return {
      data: _provincesCache.data,
      timestamp: _provincesCache.timestamp,
      fromCache: true,
      stale: false,
    }
  }

  // (B) Cooldown
  if (!force && now < _provincesCooldownUntil) {
    if (_provincesCache) {
      const ageMs = now - _provincesCache.timestamp
      return {
        data: _provincesCache.data,
        timestamp: _provincesCache.timestamp,
        fromCache: true,
        stale: ageMs >= PROVINCES_TTL_MS,
        error: _provincesCache.lastError || 'cooldown',
      }
    }
    await sleep(_provincesCooldownUntil - now)
  }

  // (C) In-flight de-dup
  if (_provincesInFlight) {
    try {
      return await _provincesInFlight
    } catch {
      // fallthrough
    }
  }

  const fetchPromise = doFetch()
  _provincesInFlight = fetchPromise
  try {
    return await fetchPromise
  } finally {
    _provincesInFlight = null
  }

  async function doFetch() {
    let raw
    try {
      raw = await fetchAllProvinces(THAI_PROVINCES)
    } catch (e) {
      _provincesCooldownUntil = Date.now() + PROVINCES_BACKOFF_MS
      console.warn('[weatherCache] provinces fetch failed, entering cooldown:', e?.message)

      if (_provincesCache) {
        return {
          data: _provincesCache.data,
          timestamp: _provincesCache.timestamp,
          fromCache: true,
          stale: true,
          error: e?.message || 'fetch failed',
        }
      }
      return {
        data: [],
        timestamp: Date.now(),
        fromCache: false,
        stale: false,
        error: e?.message || 'fetch failed',
      }
    }

    const safe = Array.isArray(raw) ? raw : []
    const failedCount = safe.filter((it) => it && it.error).length
    const isDegraded  = failedCount > safe.length / 2

    _provincesCache = {
      data: safe,
      timestamp: Date.now(),
      lastError: isDegraded ? `${failedCount}/${safe.length} provinces failed` : null,
    }

    return {
      data: safe,
      timestamp: _provincesCache.timestamp,
      fromCache: false,
      stale: false,
      error: isDegraded ? _provincesCache.lastError : undefined,
    }
  }
}

/**
 * Force refresh provinces cache
 */
export async function refreshAllProvincesWeather(opts = {}) {
  if (opts.bypassCooldown) {
    _provincesCooldownUntil = 0
  }
  return getAllProvincesWeather({ force: true })
}

/**
 * ดูเวลา age ของ cache (ms) — ใช้แสดง "updated X นาทีที่แล้ว"
 */
export function getCacheAgeMs() {
  if (!_cache) return Infinity
  return Date.now() - _cache.timestamp
}

/**
 * ดูสถานะ cache — debug / devtool
 */
export function getCacheStatus() {
  if (!_cache) return { exists: false }
  const age = Date.now() - _cache.timestamp
  return {
    exists: true,
    ageMs: age,
    ageMinutes: Math.floor(age / 60000),
    isStale: age >= CACHE_TTL_MS,
    isVeryStale: age >= STALE_TTL_MS,
    count: _cache.data?.length || 0,
    lastError: _cache.lastError,
    cooldownRemainingMs: Math.max(0, _cooldownUntil - Date.now()),
  }
}

/**
 * Reset cache (สำหรับ dev/testing)
 */
export function resetWeatherCache() {
  _cache = null
  _inFlight = null
  _cooldownUntil = 0
  _provincesCache = null
  _provincesInFlight = null
  _provincesCooldownUntil = 0
}

export const WEATHER_CACHE_TTL_MS = CACHE_TTL_MS
export const WEATHER_CACHE_STALE_TTL_MS = STALE_TTL_MS
export const WEATHER_PROVINCES_CACHE_TTL_MS = PROVINCES_TTL_MS
