// =========================================================
// CCTV Public Cameras — กทม. + ปริมณฑล
// =========================================================
// หมายเหตุ:
// - กล้องจริงจะมี HLS .m3u8 หรือ snapshot.jpg ที่ refresh ได้
// - บาง URL เป็น placeholder/demo (จะแสดง No Signal หากโหลดไม่ได้)
// - ผู้ใช้สามารถเพิ่ม/แก้ไข URL ในไฟล์นี้ได้ตรงๆ
//
// type:
//   - 'hls'       → ใช้ HLS.js เล่น .m3u8
//   - 'snapshot'  → <img> tag refresh ทุก 5 วินาที (snapshot.jpg)
//   - 'youtube'   → YouTube Live embed
//
// category:
//   - 'traffic'   → กล้องจราจร
//   - 'highway'   → กล้องกรมทางหลวง
//   - 'water'     → กล้องเช็กระดับน้ำ/คลอง
//   - 'weather'   → กล้องสภาพอากาศ/ทัศนวิสัย

export const CCTV_CATEGORIES = {
  traffic: { label: 'กล้องจราจร', color: '#3B82F6', icon: '🚦' },
  highway: { label: 'กล้องทางหลวง', color: '#F59E0B', icon: '🛣️' },
  water:   { label: 'กล้องระดับน้ำ', color: '#06B6D4', icon: '🌊' },
  weather: { label: 'กล้องสภาพอากาศ', color: '#8B5CF6', icon: '🌤️' },
}

export const CCTV_CAMERAS = [
  // ===== กทม. กลางเมือง =====
  {
    id: 'cctv-bma-silom',
    name: 'แยกสีลม',
    nameEn: 'Silom Intersection',
    source: 'BMA Traffic',
    category: 'traffic',
    lat: 13.7260, lon: 100.5238,
    type: 'hls',
    url: 'https://cctv.bma.go.th/live/silom.m3u8', // placeholder
    description: 'จุดตัดถนนสีลม x สาทรเหนือ',
  },
  {
    id: 'cctv-bma-sathorn',
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
    id: 'cctv-bma-victory',
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
    id: 'cctv-bma-asoke',
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
    id: 'cctv-bma-pratunam',
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
    id: 'cctv-bma-ploenchit',
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
    id: 'cctv-bma-bangkae',
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
    id: 'cctv-bma-phetkasem',
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
    id: 'cctv-bma-ladkrabang',
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
    id: 'cctv-water-romklao',
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
    id: 'cctv-water-saen',
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
    id: 'cctv-water-phra',
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
    id: 'cctv-doh-motorway-9',
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
    id: 'cctv-doh-motorway-7',
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
    id: 'cctv-doh-vibhavadi',
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
    id: 'cctv-non-pakkred',
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
    id: 'cctv-non-rama5',
    name: 'ถนนรัชดา-นนทบุรี (Ratchada)',
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
    id: 'cctv-pth-rangsit',
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
    id: 'cctv-pth-lamlukka',
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
    id: 'cctv-smk-bangna',
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
    id: 'cctv-smk-bangphli',
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
    id: 'cctv-smc-mahachai',
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
    id: 'cctv-nkp-samnakkhi',
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

// ====== Helpers ======

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