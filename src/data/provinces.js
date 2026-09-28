// รายชื่อจังหวัดหลักในประเทศไทย + อำเภอ/เขต + ตำบล + จุดน้ำท่วมถนน
// พิกัดจากศูนย์กลางตัวเมือง (lat, lon) — ข้อมูลอำเภอ/ตำบล/ชุมชนเป็น mockup
// สำหรับสาธิต feature drill-down และ flood-road report

// ---------- helper ----------
// สร้าง mockup ตำบลจากอำเภอ + ตำแหน่งใกล้เคียง
function tambons(name, count, baseLat, baseLon) {
  const items = []
  for (let i = 0; i < count; i += 1) {
    items.push({
      id: `${name}-${i + 1}`,
      name: `ต.${name.split('-')[0]}${i + 1 > 1 ? ` ${i + 1}` : ''}`,
      lat: baseLat + (Math.random() - 0.5) * 0.05,
      lon: baseLon + (Math.random() - 0.5) * 0.05,
    })
  }
  return items
}

const amphoeFactory = (provinceId, list, baseLat, baseLon) =>
  list.map((name, idx) => {
    const lat = baseLat + (idx - list.length / 2) * 0.08
    const lon = baseLon + (idx - list.length / 2) * 0.08
    return {
      id: `${provinceId}-${idx + 1}`,
      name,
      lat,
      lon,
      tambons: tambons(name, 3 + Math.floor(Math.random() * 3), lat, lon),
    }
  })

// ---------- Bangkok (เขต) ----------
const BKK_AMPHURE = [
  'เขตพระนคร', 'เขตปทุมวัน', 'เขตจตุจักร', 'เขตบางรัก',
  'เขตลาดพร้าว', 'เขตห้วยขวาง', 'เขตดินแดง', 'เขตราชเทวี',
].map((name, idx) => ({
  id: `bkk-${idx + 1}`,
  name,
  lat: 13.7563 + (idx - 4) * 0.012,
  lon: 100.5018 + (idx - 4) * 0.012,
  tambons: [
    { id: `bkk-${idx + 1}-1`, name: 'แขวงพระบรมมหาราชวัง', lat: 13.7563, lon: 100.5018 },
    { id: `bkk-${idx + 1}-2`, name: 'แขวงวังบูรพา',       lat: 13.7573, lon: 100.5028 },
    { id: `bkk-${idx + 1}-3`, name: 'แขวงท่าเตียน',         lat: 13.7583, lon: 100.5038 },
  ],
}))

// ---------- Chiang Mai ----------
const CNX_AMPHURE = amphoeFactory('cnx',
  ['อ.เมืองเชียงใหม่', 'อ.หางดง', 'อ.สันทราย', 'อ.แม่ริม', 'อ.ดอยสะเก็ด', 'อ.แม่แตง'],
  18.7883, 98.9853)

// ---------- Ubon Ratchathani ----------
const UBON_AMPHURE = amphoeFactory('ubon',
  ['อ.เมืองอุบลราชธานี', 'อ.วารินชำราบ', 'อ.เดชอุดม', 'อ.ม่วงสามสิบ', 'อ.ตระการพืชผล', 'อ.พิบูลมังสาหาร'],
  15.2448, 104.8473)

// ---------- Songkhla (Hat Yai) ----------
const SKA_AMPHURE = amphoeFactory('ska',
  ['อ.หาดใหญ่', 'อ.เมืองสงขลา', 'อ.สะเดา', 'อ.นาหม่อม', 'อ.คลองหอยโข่ง', 'อ.บางกล่ำ'],
  7.0086, 100.4747)

// ---------- Provinces ----------
export const THAI_PROVINCES = [
  {
    id: 'bkk', name: 'กรุงเทพมหานคร', region: 'กลาง',
    lat: 13.7563, lon: 100.5018,
    amphure: BKK_AMPHURE,
  },
  {
    id: 'cnx', name: 'เชียงใหม่', region: 'เหนือ',
    lat: 18.7883, lon: 98.9853,
    amphure: CNX_AMPHURE,
  },
  {
    id: 'cmi', name: 'เชียงราย', region: 'เหนือ',
    lat: 19.9105, lon: 99.8406,
    amphure: amphoeFactory('cmi', ['อ.เมืองเชียงราย', 'อ.แม่จัน', 'อ.แม่สาย', 'อ.เชียงของ', 'อ.พาน'], 19.9105, 99.8406),
  },
  {
    id: 'kkn', name: 'ขอนแก่น', region: 'อีสาน',
    lat: 16.4419, lon: 102.8360,
    amphure: amphoeFactory('kkn', ['อ.เมืองขอนแก่น', 'อ.น้ำพอง', 'อ.บ้านฝาง', 'อ.กระนวน', 'อ.พล'], 16.4419, 102.8360),
  },
  {
    id: 'ubon', name: 'อุบลราชธานี', region: 'อีสาน',
    lat: 15.2448, lon: 104.8473,
    amphure: UBON_AMPHURE,
  },
  {
    id: 'nak', name: 'นครราชสีมา', region: 'อีสาน',
    lat: 14.9799, lon: 102.0977,
    amphure: amphoeFactory('nak', ['อ.เมืองนครราชสีมา', 'อ.สีคิ้ว', 'อ.ปากช่อง', 'อ.ด่านขุนทด'], 14.9799, 102.0977),
  },
  {
    id: 'ska', name: 'สงขลา', region: 'ใต้',
    lat: 7.0086, lon: 100.4747,
    amphure: SKA_AMPHURE,
  },
  {
    id: 'pkt', name: 'ภูเก็ต', region: 'ใต้',
    lat: 7.8804, lon: 98.3923,
    amphure: amphoeFactory('pkt', ['อ.เมืองภูเก็ต', 'อ.กะทู้', 'อ.ถลาง'], 7.8804, 98.3923),
  },
  {
    id: 'kbi', name: 'กระบี่', region: 'ใต้',
    lat: 8.0863, lon: 98.9063,
    amphure: amphoeFactory('kbi', ['อ.เมืองกระบี่', 'อ.อ่าวลึก', 'อ.เกาะลันตา'], 8.0863, 98.9063),
  },
  {
    id: 'sur', name: 'สุราษฎร์ธานี', region: 'ใต้',
    lat: 9.1382, lon: 99.3211,
    amphure: amphoeFactory('sur', ['อ.เมืองสุราษฎร์ธานี', 'อ.เกาะสมุย', 'อ.เกาะพะงัน'], 9.1382, 99.3211),
  },
  {
    id: 'nrt', name: 'นราธิวาส', region: 'ใต้',
    lat: 6.4255, lon: 101.8253,
    amphure: amphoeFactory('nrt', ['อ.เมืองนราธิวาส', 'อ.ตากใบ', 'อ.สุไหงโก-ลก', 'อ.ระแงะ'], 6.4255, 101.8253),
  },
  {
    id: 'ayt', name: 'อยุธยา', region: 'กลาง',
    lat: 14.3532, lon: 100.5683,
    amphure: amphoeFactory('ayt', ['อ.พระนครศรีอยุธยา', 'อ.บางปะอิน', 'อ.วังน้อย', 'อ.บางบาล'], 14.3532, 100.5683),
  },
  {
    id: 'nkh', name: 'นครสวรรค์', region: 'กลาง',
    lat: 15.6938, lon: 100.1234,
    amphure: amphoeFactory('nkh', ['อ.เมืองนครสวรรค์', 'อ.โกรกพระ', 'อ.ตาคลี', 'อ.พยุหะคีรี'], 15.6938, 100.1234),
  },
  {
    id: 'cbo', name: 'ชลบุรี', region: 'ตะวันออก',
    lat: 13.3611, lon: 100.9847,
    amphure: amphoeFactory('cbo', ['อ.เมืองชลบุรี', 'อ.ศรีราชา', 'อ.พัทยา', 'อ.บางละมุง'], 13.3611, 100.9847),
  },
  {
    id: 'ryg', name: 'ระยอง', region: 'ตะวันออก',
    lat: 12.6814, lon: 101.2810,
    amphure: amphoeFactory('ryg', ['อ.เมืองระยอง', 'อ.บ้านฉาง', 'อ.แกลง'], 12.6814, 101.2810),
  },
  {
    id: 'nst', name: 'นครศรีธรรมราช', region: 'ใต้',
    lat: 8.4304, lon: 99.9631,
    amphure: amphoeFactory('nst', ['อ.เมืองนครศรีธรรมราช', 'อ.ทุ่งสง', 'อ.สิชล'], 8.4304, 99.9631),
  },
  {
    id: 'pre', name: 'เพชรบุรี', region: 'ตะวันตก',
    lat: 13.1119, lon: 99.9447,
    amphure: amphoeFactory('pre', ['อ.เมืองเพชรบุรี', 'อ.ชะอำ', 'อ.หัวหิน'], 13.1119, 99.9447),
  },
  {
    id: 'kan', name: 'กาญจนบุรี', region: 'ตะวันตก',
    lat: 14.0228, lon: 99.5322,
    amphure: amphoeFactory('kan', ['อ.เมืองกาญจนบุรี', 'อ.ท่ามะกา', 'อ.ท่าม่วง'], 14.0228, 99.5322),
  },
]

// ---------- Flood Reports (mockup) ----------
// severity: critical | watch | caution
export const FLOOD_REPORTS = [
  // กรุงเทพฯ
  { id: 'fr-01', name: 'ถนนวิภาวดีรังสิต (แยกดินแดง)', province: 'bkk', amphure: 'bkk-7', lat: 13.7779, lon: 100.5550,
    waterLevel: 'สูงระดับหัวเข่า (~40 ซม.)', severity: 'watch', reportedAt: '2026-09-28 08:30',
    note: 'การจราจรติดขัด รถเล็กไม่แนะนำผ่าน' },
  { id: 'fr-02', name: 'ชุมชนร่มเกล้า ซอยร่มเกล้า 12', province: 'bkk', amphure: 'bkk-6', lat: 13.7590, lon: 100.5610,
    waterLevel: 'สูงถึงระดับคอ (~150 ซม.)', severity: 'critical', reportedAt: '2026-09-28 09:15',
    note: 'อพยพด่วน ปิดเส้นทางทั้งหมด' },
  { id: 'fr-03', name: 'ถนนรัชดาภิเษก (ใต้ดินลอยฟ้า)', province: 'bkk', amphure: 'bkk-3', lat: 13.7891, lon: 100.5707,
    waterLevel: 'ระดับข้อเท้า (~15 ซม.)', severity: 'caution', reportedAt: '2026-09-28 07:45',
    note: 'รถทุกชนิดยังสัญจรได้' },
  { id: 'fr-04', name: 'ซอยสุขุมวิท 50', province: 'bkk', amphure: 'bkk-2', lat: 13.7207, lon: 100.5670,
    waterLevel: 'ระดับเอว (~80 ซม.) — สัญจรไม่ได้', severity: 'critical', reportedAt: '2026-09-28 10:05',
    note: 'ปิดซอย ติดตั้งเครื่องสูบน้ำ' },

  // เชียงใหม่
  { id: 'fr-05', name: 'ถนนนิมมานเหมินทร์ (แยกศรีบุญเรือง)', province: 'cnx', amphure: 'cnx-1', lat: 18.8018, lon: 98.9660,
    waterLevel: 'ระดับหัวเข่า (~45 ซม.)', severity: 'watch', reportedAt: '2026-09-28 06:20',
    note: 'น้ำท่วมขังจากฝนตกหนักกลางดึก' },
  { id: 'fr-06', name: 'ชุมชนริมคลองแม่ข่า', province: 'cnx', amphure: 'cnx-4', lat: 18.7820, lon: 98.9700,
    waterLevel: 'สูงระดับเอว (~70 ซม.)', severity: 'watch', reportedAt: '2026-09-28 07:50',
    note: 'ระวังกระแสน้ำเชี่ยว' },

  // อุบลราชธานี
  { id: 'fr-07', name: 'ถนนแจ้งสนิท (หน้าตลาด)', province: 'ubon', amphure: 'ubon-1', lat: 15.2360, lon: 104.8580,
    waterLevel: 'สูงระดับเอว (~85 ซม.) — สัญจรไม่ได้', severity: 'critical', reportedAt: '2026-09-28 08:00',
    note: 'น้ำจากแม่น้ำมูลล้นตลิ่ง' },
  { id: 'fr-08', name: 'ชุมชนวารินชำราบ', province: 'ubon', amphure: 'ubon-2', lat: 15.1640, lon: 104.8660,
    waterLevel: 'สูงระดับอก (~120 ซม.)', severity: 'critical', reportedAt: '2026-09-28 09:00',
    note: 'ต้องอพยพประชาชน 200 ครัวเรือน' },

  // สงขลา (หาดใหญ่)
  { id: 'fr-09', name: 'ถนนเพชรเกษม (หาดใหญ่-สงขลา)', province: 'ska', amphure: 'ska-1', lat: 7.0240, lon: 100.4670,
    waterLevel: 'ระดับข้อเท้า (~20 ซม.)', severity: 'caution', reportedAt: '2026-09-28 06:30',
    note: 'รถเล็กควรหลีกเลี่ยง' },

  // ภูเก็ต
  { id: 'fr-10', name: 'ถนนท่าแค้ง-ป่าตอง', province: 'pkt', amphure: 'pkt-1', lat: 7.8990, lon: 98.3850,
    waterLevel: 'ระดับหัวเข่า (~50 ซม.)', severity: 'watch', reportedAt: '2026-09-28 07:00',
    note: 'ดินสไลด์บางช่วง' },

  // นครราชสีมา
  { id: 'fr-11', name: 'ถนนมิตรภาพ (อ.สีคิ้ว)', province: 'nak', amphure: 'nak-2', lat: 14.8720, lon: 101.7080,
    waterLevel: 'ระดับข้อเท้า (~10 ซม.)', severity: 'caution', reportedAt: '2026-09-28 05:45',
    note: 'สัญจรได้ปกติ' },

  // อยุธยา
  { id: 'fr-12', name: 'ถนนสายเอเชีย (อยุธยา)', province: 'ayt', amphure: 'ayt-1', lat: 14.3580, lon: 100.5780,
    waterLevel: 'สูงระดับหัวเข่า (~40 ซม.)', severity: 'watch', reportedAt: '2026-09-28 06:10',
    note: 'น้ำท่วมขังหลายช่วง' },
]

export const SEVERITY_META = {
  critical: { label: 'วิกฤต',          color: '#DC2626', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500' },
  watch:    { label: 'เฝ้าระวัง',      color: '#EA580C', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  caution:  { label: 'สัญจรลำบาก',     color: '#CA8A04', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
}