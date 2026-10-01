// =========================================================
// RainViewer API — public/free, no key required
// =========================================================
// Docs: https://www.rainviewer.com/api/weather-maps-api.html
//
// Endpoint: https://api.rainviewer.com/public/weather-maps.json
//
// Response shape:
// {
//   version: "8.0",
//   generated: 1735000000,
//   host: "https://tilecache.rainviewer.com",
//   radar: {
//     past: [
//       { time: 1735000000, path: "/v2/radar/1735000000" },
//       ...
//     ],
//     nowcast: [ { time: ..., path: ... }, ... ]
//   },
//   ...
// }
//
// Tile URL pattern:
//   {host}{path}/256/{z}/{x}/{y}/{color_scheme}/{options}.png
//   e.g. https://tilecache.rainviewer.com/v2/radar/1735000000/256/3/5/4/2/1_1.png
//
// Cache strategy:
//   - Cache response 5 นาที — ไม่จำเป็นต้องเรียกบ่อย (server side มัน update ทุก 5–10 นาที)
//   - ใช้ localStorage ถ้า available

const CACHE_KEY = 'rainthai.rainviewer.v1'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 นาที

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (Date.now() - obj._cachedAt > CACHE_TTL_MS) return null
    return obj.data
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      _cachedAt: Date.now(),
      data,
    }))
  } catch {}
}

export async function fetchRainViewerTimestamps({ force = false } = {}) {
  // ลอง cache ก่อน
  if (!force) {
    const cached = readCache()
    if (cached) return cached
  }

  const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`RainViewer API HTTP ${res.status}`)
  }
  const data = await res.json()
  writeCache(data)
  return data
}

/**
 * Build tile URL จาก radar frame
 * @param {object} frame - { time, path }
 * @param {object} opts - { host?, size?, smooth?, snow?, color?, options? }
 */
export function buildRainViewerTileUrl(frame, opts = {}) {
  const host = opts.host || 'https://tilecache.rainviewer.com'
  const size = opts.size || 256
  const color = opts.color || 4         // 4 = Universal Blue (default)
  const options = opts.options || '2_1' // 2 = smoothness, 1 = snow
  return `${host}/v2/radar/${frame.time}/${size}/{z}/{x}/{y}/${color}/${options}.png`
}