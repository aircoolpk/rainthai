// =========================================================
// CCTV Public Cameras — กทม. + ปริมณฑล
// =========================================================
// หมายเหตุ:
// - กล้องหลายตัวจาก BMA/DOH ติด CORS / ไม่เปิด public feed
// - ใช้ fallback chain: direct → world.tehx.dyndns.info/flood proxy → No Signal
//
// โครงสร้าง Proxy URL (เลียนแบบ world.tehx.dyndns.info/flood):
//   snapshot: {proxy_BASE}/snapshot/{camId}.jpg
//   hls:      {proxy_BASE}/hls/{camId}/playlist.m3u8
//
// type:
//   - 'hls'       → ใช้ HLS.js เล่น .m3u8
//   - 'snapshot'  → <img> tag refresh ทุก 5-10 วินาที (snapshot.jpg)
//   - 'youtube'   → YouTube Live embed
//
// category:
//   - 'traffic'   → กล้องจราจร
//   - 'highway'   → กล้องกรมทางหลวง
//   - 'water'     → กล้องเช็กระดับน้ำ/คลอง
//   - 'weather'   → กล้องสภาพอากาศ/ทัศนวิสัย

// =========================================================
// Proxy Configuration
// =========================================================
// ถ้า upstream ของ กทม. ติด CORS ให้ proxy ผ่าน world.tehx.dyndns.info/flood
// ผู้ใช้สามารถเปลี่ยน PROXY_BASE ได้ตามต้องการ
export const CCTV_PROXY_CONFIG = {
  enabled: true,
  // Base URL ของ proxy ที่ใช้ดึงภาพ (เลียนแบบ world.tehx.dyndns.info/flood)
  proxyBase: 'https://world.tehx.dyndns.info/flood',

  // Refresh interval (ms) — fallback proxy จะใช้ refresh ช้ากว่าเพื่อลด load
  refreshIntervalFastMs: 5000,   // direct snapshot
  refreshIntervalSlowMs: 10000,  // proxy snapshot

  // Timeout สำหรับการโหลด (ms)
  loadTimeoutMs: 8000,

  // Source credit (แสดงใน player/popup/sidebar footer)
  sourceCredit: {
    th: 'ขอบคุณข้อมูลภาพจาก: สำนักการจราจรและขนส่ง กทม. / world.tehx.dyndns.info',
    short: 'ที่มา: กทม. + world.tehx.dyndns.info',
  },
}

// =========================================================
// Helpers — สร้าง proxy URL จาก camId
// =========================================================

/**
 * สร้าง snapshot URL (ภาพนิ่ง refresh ทุก N วินาที)
 * @param {string} camId
 * @returns {string|null}
 */
export function buildProxySnapshotUrl(camId) {
  if (!CCTV_PROXY_CONFIG.enabled) return null
  return `${CCTV_PROXY_CONFIG.proxyBase}/snapshot/${camId}.jpg`
}

/**
 * สร้าง HLS playlist URL
 * @param {string} camId
 * @returns {string|null}
 */
export function buildProxyHlsUrl(camId) {
  if (!CCTV_PROXY_CONFIG.enabled) return null
  return `${CCTV_PROXY_CONFIG.proxyBase}/hls/${camId}/playlist.m3u8`
}

export const CCTV_CATEGORIES = {
  traffic: { label: 'กล้องจราจร', color: '#3B82F6', icon: '🚦' },
  highway: { label: 'กล้องทางหลวง', color: '#F59E0B', icon: '🛣️' },
  water:   { label: 'กล้องระดับน้ำ', color: '#06B6D4', icon: '🌊' },
  weather: { label: 'กล้องสภาพอากาศ', color: '#8B5CF6', icon: '🌤️' },
}

// =========================================================
// Camera Registry — ใช้ proxy เป็น primary เพื่อหลีกเลี่ยง CORS
// =========================================================
// โครงสร้างข้อมูล:
//   - id          : unique id (ใช้สร้าง proxy URL)
//   - name        : ชื่อกล้อง
//   - nameEn      : ชื่อภาษาอังกฤษ
//   - source      : แหล่งที่มา (label)
//   - category    : traffic | highway | water | weather
//   - lat, lon    : พิกัดบนแผนที่
//   - type        : 'hls' | 'snapshot' | 'youtube'
//   - url         : direct URL (fallback ถ้า proxy fail)
//   - proxyUrl    : proxy URL จาก camId (auto-generated ตอน runtime)
//   - description : คำอธิบายเพิ่มเติม

export const CCTV_CAMERAS = [
  // ===== กทม. กลางเมือง =====
  {
    id: 'bma-silom',
    name: 'แยกสีลม',
    nameEn: 'Silom Intersection',
    source: 'BMA Traffic',
    category: 'traffic',
    lat: 13.7260, lon: 100.5238,
    type: 'snapshot',
    url: 'https://cctv.bma.go.th/snapshot/silom.jpg',
    description: 'จุดตัดถนนสีลม x สาทรเหนือ',
  },
  {
    id: 'bma-sathorn',
    name: 'แยกสาทร',
    nameEn: 'Sathorn Intersection',
    source: 'BMA Traffic',
    category: 'traffic',
    lat: 13.7240, lon: 100.5290,
    type: 'snapshot',
    url: 'https://cctv.bma.go.th/snapshot/sathorn.jpg',
    description: 'ถนนสาทรเหนือ ใกล้ BTS สะพานตากสิน',
  },
  {
    id: 'bma-victory',
    name: 'อนุสาวรีย์ชัยสมรภูมิ',
    nameEn: 'Victory Monument',
    source: 'BMA Traffic',
    category: 'traffic',
    lat: 13.7650, lon: 100.5370,
    type: 'snapshot',
    url: 'https://cctv.bma.go.th/snapshot/victory.jpg',
    description: 'วงเวียนอนุสาวรีย์ชัย จุดตัดราชดำริ',
  },
  {
    id: 'bma-asoke',
    name: 'แยกอโศก',
    nameEn: 'Asok Intersection',
    source: 'BMA Traffic',
    category: 'traffic',
    lat: 13.7370, lon: 100.5550,
    type: 'hls',
    url: 'https://cctv.bma.go.th/live/asoke.m3u8',
    description: 'จุดตัดอโศก-สุขุมวิท',
  },
  {
    id: 'bma-pratunam',
    name: 'แยกประตูน้ำ',
    nameEn: 'Pratunam',
    source: 'BMA Traffic',
    category: 'traffic',
    lat: 13.7480, lon: 100.5390,
    type: 'snapshot',
    url: 'https://cctv.bma.go.th/snapshot/pratunam.jpg',
    description: 'ถนนเพลินจิต x ราชดำริ',
  },
  {
    id: 'bma-ploenchit',
    name: 'แยกเพลินจิต',
    nameEn: 'Ploenchit',
    source: 'BMA Traffic',
    category: 'traffic',
    lat: 13.7440, lon: 100.5470,
    type: 'snapshot',
    url: 'https://cctv.bma.go.th/snapshot/ploenchit.jpg',
    description: 'ถนนเพลินจิต ใกล้ BTS เพลินจิต',
  },

  // ===== กทม. ฝั่งตะวันตก =====
  {
    id: 'bma-bangkae',
    name: 'แยกบางแค',
    nameEn: 'Bangkae Intersection',
    source: 'BMA Traffic',
    category: 'traffic',
    lat: 13.6961, lon: 100.4099,
    type: 'snapshot',
    url: 'https://cctv.bma.go.th/snapshot/bangkae.jpg',
    description: 'ถนนเพชรเกษม x บางแค',
  },
  {
    id: 'bma-phetkasem',
    name: 'ถนนเพชรเกษม กม.12',
    nameEn: 'Phetkasem Km.12',
    source: 'BMA Traffic',
    category: 'traffic',
    lat: 13.7100, lon: 100.4000,
    type: 'snapshot',
    url: 'https://cctv.bma.go.th/snapshot/phetkasem12.jpg',
    description: 'ถนนเพชรเกษม บริเวณหนองแขม',
  },

  // ===== กทม. ฝั่งตะวันออก (เขตวิกฤตน้ำท่วม) =====
  {
    id: 'bma-ladkrabang',
    name: 'แยกลาดกระบัง',
    nameEn: 'Lat Krabang',
    source: 'BMA Traffic',
    category: 'traffic',
    lat: 13.7259, lon: 100.7708,
    type: 'hls',
    url: 'https://cctv.bma.go.th/live/ladkrabang.m3u8',
    description: 'ถนนลาดกระบัง ใกล้สนามบินสุวรรณภูมิ',
  },
  {
    id: 'bma-romklao-water',
    name: 'คลองร่มเกล้า (เช็กระดับน้ำ)',
    nameEn: 'Rom Klao Canal Water Level',
    source: 'BMA Drainage',
    category: 'water',
    lat: 13.7563, lon: 100.7343,
    type: 'snapshot',
    url: 'https://cctv.bma.go.th/snapshot/romklao-water.jpg',
    description: 'สถานีวัดระดับน้ำคลองร่มเกล้า',
  },
  {
    id: 'bma-saensaep',
    name: 'คลองแสนแสบ',
    nameEn: 'Saen Saep Canal',
    source: 'BMA Drainage',
    category: 'water',
    lat: 13.7772, lon: 100.5713,
    type: 'snapshot',
    url: 'https://cctv.bma.go.th/snapshot/saensaep.jpg',
    description: 'คลองแสนแสบ ใกล้ MRT ห้วยขวาง',
  },
  {
    id: 'bma-phrakhanong',
    name: 'คลองพระโขนง',
    nameEn: 'Phra Khanong Canal',
    source: 'BMA Drainage',
    category: 'water',
    lat: 13.7100, lon: 100.5918,
    type: 'snapshot',
    url: 'https://cctv.bma.go.th/snapshot/phrakhanong.jpg',
    description: 'คลองพระโขนง ใกล้ BTS พระโขนง',
  },

  // ===== กรมทางหลวง (DOH) =====
  {
    id: 'doh-motorway-9',
    name: 'ทางหลวงพิเศษ M9 (วงแหวนรอบนอก)',
    nameEn: 'Motorway M9 Outer Ring',
    source: 'DOH',
    category: 'highway',
    lat: 13.8500, lon: 100.4500,
    type: 'hls',
    url: 'https://doh.mot.go.th/cctv/m9-west.m3u8',
    description: 'ทางหลวงพิเศษ M9 ฝั่งตะวันตก',
  },
  {
    id: 'doh-motorway-7',
    name: 'ทางหลวงพิเศษ M7 (มอเตอร์เวย์)',
    nameEn: 'Motorway M7',
    source: 'DOH',
    category: 'highway',
    lat: 13.6500, lon: 100.5500,
    type: 'snapshot',
    url: 'https://doh.mot.go.th/cctv/m7-bangkae.jpg',
    description: 'มอเตอร์เวย์ M7 ช่วงบางแค',
  },
  {
    id: 'doh-vibhavadi',
    name: 'ถนนวิภาวดีรังสิต',
    nameEn: 'Vibhavadi Rangsit Rd',
    source: 'DOH',
    category: 'highway',
    lat: 13.8286, lon: 100.5599,
    type: 'snapshot',
    url: 'https://doh.mot.go.th/cctv/vibhavadi-jtc.jpg',
    description: 'วิภาวดีรังสิต ใกล้ห้าแยกจตุจักร',
  },

  // ===== ปริมณฑล: นนทบุรี =====
  {
    id: 'non-pakkred',
    name: 'ปากเกร็ด (สะพานพระราม 4)',
    nameEn: 'Pakkred Bridge',
    source: 'DOH',
    category: 'highway',
    lat: 13.9100, lon: 100.5067,
    type: 'snapshot',
    url: 'https://doh.mot.go.th/cctv/pakkred.jpg',
    description: 'สะพานพระราม 4 ข้ามแม่น้ำเจ้าพระยา',
  },
  {
    id: 'non-ratchada',
    name: 'ถนนรัชดา-นนทบุรี',
    nameEn: 'Ratchada Nonthaburi',
    source: 'DOH',
    category: 'highway',
    lat: 13.8621, lon: 100.5144,
    type: 'snapshot',
    url: 'https://doh.mot.go.th/cctv/ratchada-nonthaburi.jpg',
    description: 'ถนนรัชดา-นนทบุรี ใกล้สถานีรถไฟฟ้า',
  },

  // ===== ปริมณฑล: ปทุมธานี =====
  {
    id: 'pth-rangsit-canal',
    name: 'รังสิต (คลองรังสิตประยูรศักดิ์)',
    nameEn: 'Rangsit Canal',
    source: 'DOH',
    category: 'water',
    lat: 14.0208, lon: 100.5250,
    type: 'snapshot',
    url: 'https://doh.mot.go.th/cctv/rangsit-canal.jpg',
    description: 'สถานีวัดระดับน้ำคลองรังสิต',
  },
  {
    id: 'pth-lamlukka',
    name: 'ลำลูกกา (ถนนลำลูกกา)',
    nameEn: 'Lam Luk Ka',
    source: 'DOH',
    category: 'highway',
    lat: 13.9700, lon: 100.6800,
    type: 'snapshot',
    url: 'https://doh.mot.go.th/cctv/lamlukka.jpg',
    description: 'ถนนลำลูกกา ใกล้ตลาดลำลูกกา',
  },

  // ===== ปริมณฑล: สมุทรปราการ =====
  {
    id: 'smk-bangna',
    name: 'บางนา (ถนนบางนา-ตราด)',
    nameEn: 'Bangna-Trat Rd',
    source: 'DOH',
    category: 'highway',
    lat: 13.6722, lon: 100.6130,
    type: 'snapshot',
    url: 'https://doh.mot.go.th/cctv/bangna.jpg',
    description: 'กม.5 ถนนบางนา-ตราด',
  },
  {
    id: 'smk-bangphli',
    name: 'บางพลี (สะพานกลับรถ)',
    nameEn: 'Bang Phli',
    source: 'DOH',
    category: 'highway',
    lat: 13.5950, lon: 100.7100,
    type: 'snapshot',
    url: 'https://doh.mot.go.th/cctv/bangphli.jpg',
    description: 'ถนนเทพราช-บางพลี',
  },

  // ===== ปริมณฑล: สมุทรสาคร =====
  {
    id: 'smc-mahachai',
    name: 'มหาชัย (สะพานข้ามแม่น้ำท่าจีน)',
    nameEn: 'Mahachai Bridge',
    source: 'DOH',
    category: 'water',
    lat: 13.5500, lon: 100.2750,
    type: 'snapshot',
    url: 'https://doh.mot.go.th/cctv/mahachai.jpg',
    description: 'สะพานมหาชัย ข้ามแม่น้ำท่าจีน',
  },

  // ===== ปริมณฑล: นครปฐม =====
  {
    id: 'nkp-samnakkhi',
    name: 'สามแคว (นครปฐม)',
    nameEn: 'Sam Nakkhi',
    source: 'DOH',
    category: 'water',
    lat: 13.8200, lon: 100.0600,
    type: 'snapshot',
    url: 'https://doh.mot.go.th/cctv/samnakkhi.jpg',
    description: 'จุดวัดระดับน้ำสามแคว นครปฐม',
  },
]

// =========================================================
// Resolved URL helpers (ใช้ใน Player)
// =========================================================

/**
 * Resolve URL ตาม fallback chain:
 *   1. proxyUrl (proxy snapshot/HLS ผ่าน world.tehx.dyndns.info)
 *   2. url (direct snapshot/HLS จากต้นทาง)
 * @param {object} camera
 * @returns {{ url: string, source: 'proxy' | 'direct' }}
 */
export function resolveCameraUrl(camera) {
  const proxyUrl = camera.type === 'hls'
    ? buildProxyHlsUrl(camera.id)
    : buildProxySnapshotUrl(camera.id)

  if (proxyUrl && CCTV_PROXY_CONFIG.enabled) {
    return { url: proxyUrl, source: 'proxy' }
  }
  return { url: camera.url, source: 'direct' }
}

/**
 * Resolve refresh interval ตาม source
 * @param {'proxy' | 'direct'} source
 * @returns {number} ms
 */
export function resolveRefreshInterval(source) {
  return source === 'proxy'
    ? CCTV_PROXY_CONFIG.refreshIntervalSlowMs
    : CCTV_PROXY_CONFIG.refreshIntervalFastMs
}

// ====== Helpers (เดิม) ======

export function getCCTVById(id) {
  return CCTV_CAMERAS.find((c) => c.id === id) || null
}

export function getCCTVByCategory(cat) {
  if (!cat || cat === 'all') return CCTV_CAMERAS
  return CCTV_CAMERAS.filter((c) => c.category === cat)
}

// จัดกลุ่มตาม category (ใช้ใน Sidebar)
export function groupCCTVByCategory() {
  const groups = {}
  CCTV_CAMERAS.forEach((cam) => {
    if (!groups[cam.category]) groups[cam.category] = []
    groups[cam.category].push(cam)
  })
  return groups
}