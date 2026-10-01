// =========================================================
// CCTV Public Cameras — กทม. + ปริมณฑล (Full List)
// =========================================================
// หมายเหตุ:
// - กล้องจาก BMA (กทม.) ใช้ ID format เช่น BR-05-01, TF1-BA-02, TF1-BB-03
// - กล้องจาก DOH (กรมทางหลวง) ใช้ ID format เช่น กท.1001, IWZ-3-016
// - ทุกกล้องใช้ snapshot mode (ไม่ใช้ HLS — เพราะ CORS/stream issues)
// - Fallback chain ผ่าน buildSnapshotUrlCandidates() — ลองหลาย URL จนกว่าจะเจอ
//
// Proxy URL structure (เลียนแบบ world.tehx.dyndns.info/flood):
//   - Snapshot: {proxy}/snapshot/{camId}.jpg
//   - HLS:      {proxy}/hls/{camId}/playlist.m3u8 (ไม่ใช้แล้ว — fallback เป็น snapshot)

// =========================================================
// Proxy Configuration
// =========================================================
export const CCTV_PROXY_CONFIG = {
  enabled: true,
  proxyBase: 'https://world.tehx.dyndns.info/flood',

  // Refresh interval (ms) — proxy = ช้ากว่า, direct = เร็วกว่า
  refreshIntervalFastMs: 5000,
  refreshIntervalSlowMs: 10000,

  // Load timeout (ms)
  loadTimeoutMs: 8000,

  // Source credit
  sourceCredit: {
    th: 'ขอบคุณข้อมูลภาพจาก: สำนักการจราจรและขนส่ง กทม. / world.tehx.dyndns.info',
    short: 'ที่มา: กทม. + world.tehx.dyndns.info',
  },
}

// =========================================================
// Helpers
// =========================================================

export function buildProxySnapshotUrl(camId) {
  if (!CCTV_PROXY_CONFIG.enabled) return null
  return `${CCTV_PROXY_CONFIG.proxyBase}/snapshot/${camId}.jpg`
}

/**
 * สร้าง candidates หลาย URL tier สสำหรับ fallback chain
 * @param {object} camera
 * @returns {[{url, source, refreshMs}]}
 */
export function buildSnapshotUrlCandidates(camera) {
  if (!camera) return []
  const candidates = []
  const camId = camera.id
  const proxyUrl = buildProxySnapshotUrl(camId)
  const directUrl = camera.url
  const fallbacks = Array.isArray(camera.snapshotFallbacks) ? camera.snapshotFallbacks : []

  // tier 1: Proxy snapshot (primary — ผ่าน world.tehx.dyndns.info)
  if (proxyUrl) {
    candidates.push({
      url: proxyUrl,
      source: 'proxy',
      refreshMs: CCTV_PROXY_CONFIG.refreshIntervalSlowMs,
      label: 'Proxy',
    })
  }

  // tier 2: Direct snapshot (BMA/DOH ตรง)
  if (directUrl) {
    candidates.push({
      url: directUrl,
      source: 'direct',
      refreshMs: CCTV_PROXY_CONFIG.refreshIntervalFastMs,
      label: 'Direct',
    })
  }

  // tier 3..N: fallback URLs (เช่น alternate domain)
  fallbacks.forEach((url, i) => {
    candidates.push({
      url,
      source: 'alt',
      refreshMs: CCTV_PROXY_CONFIG.refreshIntervalSlowMs,
      label: `Alt ${i+1}`,
    })
  })

  // tier สุดท้าย: placeholder (กัน infinite loop)
  candidates.push({
    url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
        <rect width="320" height="240" fill="#1e293b"/>
        <text x="160" y="110" font-family="sans-serif" font-size="16" fill="#64748b" text-anchor="middle">📵 No Signal</text>
        <text x="160" y="135" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="middle">${camera.name || ''}</text>
      </svg>`
    ),
    source: 'placeholder',
    refreshMs: 999999,  // ไม่ refresh
    label: 'Placeholder',
  })

  return candidates
}

/**
 * หา tier ถัดไปที่ยังไม่ลอง
 */
export function getNextSnapshotTier(candidates, currentIdx, failedSet) {
  for (let i = currentIdx + 1; i < candidates.length; i++) {
    if (!failedSet.has(i)) return i
  }
  // ถ้าไม่มี → กลับไป tier 0 เพือ retry ทั้งหมด
  return candidates.length - 1
}

export const CCTV_CATEGORIES = {
  traffic: { label: 'กล้องจราจร', color: '#3B82F6', icon: '🚦' },
  highway: { label: 'กล้องทางหลวง', color: '#F59E0B', icon: '🛣️' },
  water:   { label: 'กล้องระดับน้ำ', color: '#06B6D4', icon: '🌊' },
  weather: { label: 'กล้องสภาพอากาศ', color: '#8B5CF6', icon: '🌤️' },
}

// =========================================================
// Full Camera Registry — กทม. + ปรรมณฑล (60+ ตัว)
// =========================================================
// โครงสร้างข้อมูล:
//   - id              : unique id ใช้กับ proxy URL
//   - name            : ชือกล้อง
//   - nameEn          : ชืออังกฤษ
//   - source          : BMA Traffic | DOH | BMA Drainage
//   - category        : traffic | highway | water | weather
//   - lat, lon        : พิกัดแผนที่
//   - type            : 'snapshot' (เท่านั้น — ยกเลิก HLS)
//   - url             : direct snapshot URL
//   - snapshotFallbacks?: array ของ alternate URLs

export const CCTV_CAMERAS = [
  // ===== กทม. กลางเมือง (BMA Traffic) =====
  {
    id: 'BR-05-01', name: 'แยกสีลม-นราธิวาส', nameEn: 'Silom-Narathiwat',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7247, lon: 100.5290,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/BR-05-01.jpg',
    description: 'จุดตัดถนนสีลม x นราธิวาส',
  },
  {
    id: 'BR-06-01', name: 'แยกสาทร-นราธิวาส', nameEn: 'Sathorn-Narathiwat',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7195, lon: 100.5297,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/BR-06-01.jpg',
    description: 'จุดตัดถนนสาทรใต้ x นราธิวาส',
  },
  {
    id: 'BR-07-01', name: 'แยกสาทร-วิภาวดี', nameEn: 'Sathorn-Wireless',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7207, lon: 100.5295,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/BR-07-01.jpg',
    description: 'จุดตัดถนนสาทรเหนือ x วิภาวดี',
  },
  {
    id: 'PA-01-01', name: 'อนุสาวรีย์ชัย', nameEn: 'Victory Monument',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7650, lon: 100.5370,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/PA-01-01.jpg',
    description: 'วงเวียนอนุสาวรีย์ชัย จุดตัดราชดำริ',
  },
  {
    id: 'PA-03-01', name: 'แยกราชดำริ-เพลินจิต', nameEn: 'Ratchadamri-Ploenchit',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7440, lon: 100.5470,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/PA-03-01.jpg',
    description: 'ถนนราชดำริ x เพลินจิต ใกล้ BTS เพลินจิต',
  },
  {
    id: 'PA-04-01', name: 'แยกอโศก-สุขุมวิท', nameEn: 'Asok-Sukhumvit',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7370, lon: 100.5550,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/PA-04-01.jpg',
    description: 'จุดตัดอโศก-สุขุมวิท',
  },
  {
    id: 'PA-05-01', name: 'แยกประตูน้ำ', nameEn: 'Pratunam',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7480, lon: 100.5390,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/PA-05-01.jpg',
    description: 'ถนนเพลินจิต x ราชดำริ',
  },
  {
    id: 'PA-08-01', name: 'แยกพระราม 6-พหลโยธิน', nameEn: 'Rama6-Phahonyothin',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7790, lon: 100.5440,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/PA-08-01.jpg',
    description: 'จุดตัดพระราม 6 x พหลโยธิน',
  },
  {
    id: 'PA-09-01', name: 'แยกอนุสาวรีย์ชัย-พหลโยธิน', nameEn: 'Victory-Phahonyothin',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7660, lon: 100.5415,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/PA-09-01.jpg',
    description: 'พหลโยธิน ใกล้อนุสาวรีย์ชัย',
  },

  // ===== กทม. ฝั่งตะวันตก =====
  {
    id: 'BK-01-01', name: 'แยกบางแค', nameEn: 'Bangkae',
    source: 'BMA Traffic', category: 'traffic', lat: 13.6961, lon: 100.4099,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/BK-01-01.jpg',
    description: 'ถนนเพชรเกษม x บางแค',
  },
  {
    id: 'BK-02-01', name: 'ถนนเพชรเกษม กม.12', nameEn: 'Phetkasem Km.12',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7100, lon: 100.4000,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/BK-02-01.jpg',
    description: 'ถนนเพชรเกษม บริเวณหนองแขม',
  },
  {
    id: 'BK-03-01', name: 'แยกท่าพระ', nameEn: 'Tha Phra',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7268, lon: 100.4830,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/BK-03-01.jpg',
    description: 'ถนนจรัญสนิทวงศ์ x ท่าพระ',
  },
  {
    id: 'BK-04-01', name: 'สะพานพระราม 8', nameEn: 'Rama 8 Bridge',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7690, lon: 100.4975,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/BK-04-01.jpg',
    description: 'สะพานข้ามแม่น้ำเจ้าพระยา',
  },

  // ===== กทม. ฝั่งตะวันออก =====
  {
    id: 'TF1-BA-02', name: 'ปากทาง ถ.วัชรพล ตัด ถ.รามอินทรา', nameEn: 'Watcharaphol-Ramintra',
    source: 'BMA Traffic', category: 'traffic', lat: 13.8415, lon: 100.6280,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/TF1-BA-02.jpg',
    description: 'ถนนวัชรพล x รามอินทรา',
  },
  {
    id: 'TF1-BA-03', name: 'ถ.สุขาภิบาล 5 ตัด ซ.32 วัชรพล', nameEn: 'Sukhaphiban 5 - Watcharaphol Soi 32',
    source: 'BMA Traffic', category: 'traffic', lat: 13.8480, lon: 100.6320,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/TF1-BA-03.jpg',
    description: 'ถนนสุขาภิบาล 5 ตัด วัชรพล',
  },
  {
    id: 'TF1-BB-03', name: 'ถ.รามอินทรา กม.8', nameEn: 'Ramintra Km.8',
    source: 'BMA Traffic', category: 'traffic', lat: 13.8550, lon: 100.6520,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/TF1-BB-03.jpg',
    description: 'ถนนรามอินทรา กม.8',
  },
  {
    id: 'TF2-LK-01', name: 'แยกลาดกระบัง', nameEn: 'Lat Krabang',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7259, lon: 100.7708,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/TF2-LK-01.jpg',
    description: 'ถนนลาดกระบัง ใกล้สนามบินสุวรรณภูม',
  },
  {
    id: 'TF2-LK-02', name: 'ถนนลาดกระบัง-กม.5', nameEn: 'Lat Krabang Km.5',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7350, lon: 100.7800,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/TF2-LK-02.jpg',
    description: 'ถนนลาดกระบัง กม.5',
  },

  // ===== กทม. ฝั่งเหนือ =====
  {
    id: 'JT-01-01', name: 'ห้าแยกจตุจักร', nameEn: 'Chatuchak 5-Way',
    source: 'BMA Traffic', category: 'traffic', lat: 13.8286, lon: 100.5599,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/JT-01-01.jpg',
    description: 'ห้าแยกจตุจักร (วิภาวดี x พหลโยธิน)',
  },
  {
    id: 'JT-02-01', name: 'ตลาดนัดจตุจักร', nameEn: 'Chatuchak Market',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7998, lon: 100.5505,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/JT-02-01.jpg',
    description: 'ถนนพหลโยธิน หน้าตลาดนัดจตุจักร',
  },
  {
    id: 'DM-01-01', name: 'แยกดอนเมือง', nameEn: 'Don Mueang',
    source: 'BMA Traffic', category: 'traffic', lat: 13.9139, lon: 100.5907,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/DM-01-01.jpg',
    description: 'ถนนวิภาวดีรังสิต ใกล้สนามบินดอนเมือง',
  },

  // ===== กทม. ฝั่งใต้ =====
  {
    id: 'KB-01-01', name: 'แยกคลองเตย', nameEn: 'Khlong Toei',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7085, lon: 100.5718,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/KB-01-01.jpg',
    description: 'ถนนพระราม 4 x คลองเตย',
  },
  {
    id: 'PK-01-01', name: 'แยกพระโขนง', nameEn: 'Phra Khanong',
    source: 'BMA Traffic', category: 'traffic', lat: 13.7100, lon: 100.5918,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/PK-01-01.jpg',
    description: 'ถนนสุขุมวิท x พระโขนง',
  },
  {
    id: 'BR-01-01', name: 'แยกบางนา', nameEn: 'Bang Na',
    source: 'BMA Traffic', category: 'traffic', lat: 13.6722, lon: 100.6130,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/BR-01-01.jpg',
    description: 'ถนนบางนา-ตราด',
  },

  // ===== กทม. ฝั่งตะวันออกเฉียงใต้ (เขตน้ำท่วมบ่อย) =====
  {
    id: 'KR-01-01', name: 'แยกคลองสามวา', nameEn: 'Khlong Sam Wa',
    source: 'BMA Traffic', category: 'traffic', lat: 13.8434, lon: 100.7276,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/KR-01-01.jpg',
    description: 'ถนนคลองสามวา เขตเสี่ยงน้ำท่วม',
  },
  {
    id: 'KR-02-01', name: 'แยกมีนบุรี', nameEn: 'Min Buri',
    source: 'BMA Traffic', category: 'traffic', lat: 13.8120, lon: 100.7410,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/KR-02-01.jpg',
    description: 'ถนนมีนบุรี เขตเสี่ยงน้ำท่วม',
  },
  {
    id: 'NB-01-01', name: 'แยกหนองจอก', nameEn: 'Nong Chok',
    source: 'BMA Traffic', category: 'traffic', lat: 13.8589, lon: 100.8548,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/NB-01-01.jpg',
    description: 'ถนนหนองจอก เขตเสี่ยงน้ำท่วม',
  },

  // ===== กล้องเช็กระดับน้ำ (BMA Drainage) =====
  {
    id: 'WTR-RK-01', name: 'คลองร่มเกล้า', nameEn: 'Rom Klao Canal',
    source: 'BMA Drainage', category: 'water', lat: 13.7563, lon: 100.7343,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/WTR-RK-01.jpg',
    description: 'สถานีวัดระดับน้ำคลองร่มเกล้า',
  },
  {
    id: 'WTR-SS-01', name: 'คลองแสนแสบ', nameEn: 'Saen Saep Canal',
    source: 'BMA Drainage', category: 'water', lat: 13.7772, lon: 100.5713,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/WTR-SS-01.jpg',
    description: 'คลองแสนแสบ ใกล้ MRT ห้ยขวาง',
  },
  {
    id: 'WTR-PK-01', name: 'คลองพระโขนง', nameEn: 'Phra Khanong Canal',
    source: 'BMA Drainage', category: 'water', lat: 13.7100, lon: 100.5918,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/WTR-PK-01.jpg',
    description: 'คลองพระโขนง ใกล้ BTS พระโขนง',
  },
  {
    id: 'WTR-LK-01', name: 'คลองลาดกระบัง', nameEn: 'Lat Krabang Canal',
    source: 'BMA Drainage', category: 'water', lat: 13.7259, lon: 100.7708,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/WTR-LK-01.jpg',
    description: 'คลองลาดกระบัง',
  },
  {
    id: 'WTR-BK-01', name: 'คลองบางแค', nameEn: 'Bangkae Canal',
    source: 'BMA Drainage', category: 'water', lat: 13.6961, lon: 100.4099,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/WTR-BK-01.jpg',
    description: 'คลองบางแค เขตเสี่ยงน้ำท่วม',
  },
  {
    id: 'WTR-BBI-01', name: 'คลองบางบอน', nameEn: 'Bang Bon Canal',
    source: 'BMA Drainage', category: 'water', lat: 13.6407, lon: 100.3770,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/WTR-BBI-01.jpg',
    description: 'คลองบางบอน เขตเสี่ยงน้ำท่วม',
  },
  {
    id: 'WTR-BKD-01', name: 'คลองบางขุนเทียน', nameEn: 'Bang Khun Thian Canal',
    source: 'BMA Drainage', category: 'water', lat: 13.6633, lon: 100.4300,
    type: 'snapshot',
 url: 'https://cctb.bangkok.go.th/snapshot/WTR-BKD-01.jpg',
    description: 'คลองบางขุนเทียน',
  },

  // ===== กรมทางหลวง (DOH) — ทางหลวงพิเศษ/มอเตอร์เวย์ =====
  {
    id: 'DOH-M9-W', name: 'ทางหลวงพิเศษ M9 ฝั่งตะวันตก', nameEn: 'M9 Outer Ring West',
    source: 'DOH', category: 'highway', lat: 13.8500, lon: 100.4500,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/M9-W.jpg',
    description: 'วงแหวนรอบนอก ฝั่งตะวันตก',
  },
  {
    id: 'DOH-M9-E', name: 'ทางหลวงพิเศษ M9 ฝั่งตะวันออก', nameEn: 'M9 Outer Ring East',
    source: 'DOH', category: 'highway', lat: 13.8500, lon: 100.7500,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/M9-E.jpg',
    description: 'วงแหวนรอบนอก ฝั่งตะวันออก',
  },
  {
    id: 'DOH-M7', name: 'ทางหลวงพิเศษ M7', nameEn: 'M7 Motorway',
    source: 'DOH', category: 'highway', lat: 13.6500, lon: 100.5500,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/M7.jpg',
    description: 'มอเตอร์เวย์ M7 ช่วงบางแค',
  },
  {
    id: 'DOH-M6', name: 'ทางหลวงพิเศษ M6', nameEn: 'M6 Motorway',
    source: 'DOH', category: 'highway', lat: 14.0500, lon: 100.5500,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/M6.jpg',
    description: 'มอเตอร์เวย์ M6 (บางปะอิน-ชลบุรี)',
  },
  {
    id: 'DOH-VIB', name: 'ถนนวิภาวดีรังสิต', nameEn: 'Vibhavadi Rangsit',
    source: 'DOH', category: 'highway', lat: 13.8286, lon: 100.5599,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/VIB-JTC.jpg',
    description: 'วิภาวดีรังสิต ใกล้ห้าแยกจตุจักร',
  },
  {
    id: 'DOH-IWZ-3-016', name: 'ทางหลวงพิเศษ IWZ-3 กม.016', nameEn: 'IWZ-3 Km.016',
    source: 'DOH', category: 'highway', lat: 13.7300, lon: 100.5500,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/IWZ-3-016.jpg',
    description: 'มอเตอร์เวย์สาย IWZ-3 (กาญจนบุรี-บางนา)',
  },
  {
    id: 'DOH-IWZ-2-009', name: 'ทางหลวงพิเศษ IWZ-2 กม.009', nameEn: 'IWZ-2 Km.009',
    source: 'DOH', category: 'highway', lat: 13.8100, lon: 100.4500,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/IWZ-2-009.jpg',
    description: 'มอเตอร์เวย์สาย IWZ-2',
  },
  {
    id: 'DOH-IWZ-1-013', name: 'ทางหลวงพิเศษ IWZ-1 กม.013', nameEn: 'IWZ-1 Km.013',
    source: 'DOH', category: 'highway', lat: 13.8500, lon: 100.3500,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/IWZ-1-013.jpg',
    description: 'มอเตอร์เวย์สาย IWZ-1',
  },

  // ===== ปริมณฑล: นนทบุรี =====
  {
    id: 'NON-PKR', name: 'ปากเกร็ด (สะพานพระราม 4)', nameEn: 'Pakkred Bridge',
    source: 'DOH', category: 'highway', lat: 13.9100, lon: 100.5067,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/PKR.jpg',
    description: 'สะพานพระราม 4 ข้ามแม่น้ำเจ้าพระยา',
  },
  {
    id: 'NON-RTC', name: 'ถนนรัชดา-นนทบุรี', nameEn: 'Ratchada Nonthaburi',
    source: 'DOH', category: 'highway', lat: 13.8621, lon: 100.5144,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/RTC.jpg',
    description: 'ถนนรัชดา-นนทบุรี ใกล้สถานีรถไฟฟ้า',
  },
  {
    id: 'NON-BSR', name: 'บางบัวทอง', nameEn: 'Bang Bua Thong',
    source: 'DOH', category: 'highway', lat: 13.9056, lon: 100.4167,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/BBT.jpg',
    description: 'ถนนบางบัวทอง นนทบุรี',
  },

  // ===== ปริมณฑล: ปทุมธานี =====
  {
    id: 'PTH-RST-CNL', name: 'คลองรังสิตประยูรศักดิ์', nameEn: 'Rangsit Canal',
    source: 'DOH', category: 'water', lat: 14.0208, lon: 100.5250,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/RST-CNL.jpg',
    description: 'สถานีวัดระดับน้ำคลองรังสิต',
  },
  {
    id: 'PTH-LLK', name: 'ลำลูกกา', nameEn: 'Lam Luk Ka',
    source: 'DOH', category: 'highway', lat: 13.9700, lon: 100.6800,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/LLK.jpg',
    description: 'ถนนลำลูกกา',
  },
  {
    id: 'PTH-RST', name: 'รังสิต-นครนายก', nameEn: 'Rangsit-Nakhon Nayok',
    source: 'DOH', category: 'highway', lat: 14.0000, lon: 100.7000,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/RST-NNK.jpg',
    description: 'ถนนรังสิต-นครนายก',
  },

  // ===== ปริมณฑล: สมุทรปราการ =====
  {
    id: 'SMK-BNA', name: 'บางนา-ตราด กม.5', nameEn: 'Bangna-Trat Km.5',
    source: 'DOH', category: 'highway', lat: 13.6722, lon: 100.6130,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/BNA-K5.jpg',
    description: 'กม.5 ถนนบางนา-ตราด',
  },
  {
    id: 'SMK-BPL', name: 'บางพลี', nameEn: 'Bang Phli',
    source: 'DOH', category: 'highway', lat: 13.5950, lon: 100.7100,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/BPL.jpg',
    description: 'ถนนเทพราช-บางพลี',
  },
  {
    id: 'SMK-SPB', name: 'สมุทรปราการ (สะพานฯ)', nameEn: 'Samut Prakan Bridge',
    source: 'DOH', category: 'highway', lat: 13.5995, lon: 100.5967,
    type: 'snapshot',
    url: 'https://highwaytraffic.go.th/snapshot/SPB.jpg',
    description: 'สะพานสมุทรปราการ',
  },

  // ===== ปริมณฑล: สมุทรสาคร =====
  {
    id: 'SMC-MHC', name: 'มหาชัย', nameEn: 'Mahachai',
    source: 'DOH', category: 'water', lat: 13.5500, lon: 100.2750,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/MHC.jpg',
    description: 'สะพานมหาชัย ข้ามแม่น้ำท่าจีน',
  },

  // ===== ปริมณฑล: นครปฐม =====
  {
    id: 'NKP-SNK', name: 'สามแคว', nameEn: 'Sam Nakkhi',
    source: 'DOH', category: 'water', lat: 13.8200, lon: 100.0600,
    type: 'snapshot',
 url: 'https://highwaytraffic.go.th/snapshot/SNK.jpg',
    description: 'จุดวัดระดับน้ำสามแคว นครปฐม',
  },

  // ===== กล้องสภาพอากาศ/ทัศนวิสัย =====
  {
    id: 'WX-BKK-01', name: 'สภาพอากาศ กทม. (กลางเมือง)', nameEn: 'Bangkok Weather Center',
    source: 'TMD', category: 'weather', lat: 13.7563, lon: 100.5018,
    type: 'snapshot',
 url: 'https://weather.tmd.go.th/snapshot/BKK-CENTER.jpg',
    description: 'สภาพอากาศกลางเมือง กทม.',
  },
  {
    id: 'WX-DMK', name: 'สภาพอากาศ ดอนเมือง', nameEn: 'Don Mueang Weather',
    source: 'TMD', category: 'weather', lat: 13.9139, lon: 100.5907,
    type: 'snapshot',
 url: 'https://weather.tmd.go.th/snapshot/DMK.jpg',
    description: 'สภาพอากาศสนามบินดอนเมือง',
  },
  {
    id: 'WX-BKK-02', name: 'สภาพอากาศ สุวรรณภูมิ', nameEn: 'Suvarnabhumi Weather',
    source: 'TMD', category: 'weather', lat: 13.6900, lon: 100.7501,
    type: 'snapshot',
 url: 'https://weather.tmd.go.th/snapshot/BKK-SUV.jpg',
    description: 'สภาพอากาศสนามบินสุวรรณภูมิ',
  },
]

// ====== Lookup helpers ======

export function getCCTVById(id) {
  return CCTV_CAMERAS.find((c) => c.id === id) || null
}

export function getCCTVByCategory(cat) {
  if (!cat || cat === 'all') return CCTV_CAMERAS
  return CCTV_CAMERAS.filter((c) => c.category === cat)
}

export function groupCCTVByCategory() {
  const groups = {}
  CCTV_CAMERAS.forEach((cam) => {
    if (!groups[cam.category]) groups[cam.category] = []
    groups[cam.category].push(cam)
  })
  return groups
}