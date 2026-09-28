// =========================================================
// Bangkok — 50 เขต (ครบทุกเขตในกรุงเทพมหานคร)
// =========================================================
// พิกัด center ของแต่ละเขต + ข้อมูลจำลอง: ปริมาณฝน, ระดับความเสี่ยง, ชุมชนที่ท่วมขัง
// floodCommunities: รายชื่อชุมชนที่มีรายงานน้ำท่วมขัง (mockup)

export const BKK_DISTRICTS = [
  // ===== ฝั่งตะวันออก / กลางเมือง =====
  { id: 'bkk-pkn', name: 'เขตพระนคร',         lat: 13.7649, lon: 100.4970, risk: 'safe',     rain24h: 5.2,  communities: [] },
  { id: 'bkk-dst', name: 'เขตดุสิต',            lat: 13.7766, lon: 100.5098, risk: 'safe',     rain24h: 7.5,  communities: [] },
  { id: 'bkk-nck', name: 'เขตหนองจอก',         lat: 13.8589, lon: 100.8548, risk: 'danger',   rain24h: 48.7, communities: ['ชุมชนริมคลองหนองจอก', 'หมู่บ้านนาทราย'] },
  { id: 'bkk-brk', name: 'เขตบางรัก',           lat: 13.7282, lon: 100.5293, risk: 'safe',     rain24h: 4.8,  communities: [] },
  { id: 'bkk-bkn', name: 'เขตบางเขน',           lat: 13.8710, lon: 100.5965, risk: 'moderate', rain24h: 22.4, communities: ['ชุมชนริมคลองบางเขน'] },
  { id: 'bkk-bkp', name: 'เขตบางกะปิ',         lat: 13.7651, lon: 100.6492, risk: 'safe',     rain24h: 8.1,  communities: [] },
  { id: 'bkk-ptw', name: 'เขตปทุมวัน',         lat: 13.7440, lon: 100.5340, risk: 'safe',     rain24h: 6.2,  communities: [] },
  { id: 'bkk-ppb', name: 'เขตป้อมปราบศัตรูพ่าย', lat: 13.7418, lon: 100.5105, risk: 'safe',     rain24h: 5.9,  communities: [] },
  { id: 'bkk-pyt', name: 'เขตพญาไท',           lat: 13.7570, lon: 100.5340, risk: 'safe',     rain24h: 7.0,  communities: [] },
  { id: 'bkk-hkw', name: 'เขตห้วยขวาง',        lat: 13.7772, lon: 100.5713, risk: 'moderate', rain24h: 18.3, communities: ['ชุมชนริมคลองแสนแสบ'] },
  { id: 'bkk-rtw', name: 'เขตราชเทวี',         lat: 13.7510, lon: 100.5300, risk: 'safe',     rain24h: 6.4,  communities: [] },
  { id: 'bkk-kti', name: 'เขตคลองเตย',         lat: 13.7085, lon: 100.5718, risk: 'watch',    rain24h: 28.6, communities: ['ชุมชนคลองเตย', 'ชุมชนพระโขนง'] },
  { id: 'bkk-jtc', name: 'เขตจตุจักร',         lat: 13.8286, lon: 100.5599, risk: 'critical', rain24h: 65.2, communities: ['ชุมชนวิภาวดี-ลาดยาว'] },
  { id: 'bkk-dnm', name: 'เขตดอนเมือง',        lat: 13.9139, lon: 100.5907, risk: 'moderate', rain24h: 19.7, communities: [] },
  { id: 'bkk-rkl', name: 'เขตร่มเกล้า',        lat: 13.7563, lon: 100.7343, risk: 'critical', rain24h: 72.4, communities: ['ชุมชนร่มเกล้า ซอย 12', 'ชุมชนร่มเกล้า ซอย 19', 'ชุมชนริมคลองลาดกระบัง'] },
  { id: 'bkk-lkb', name: 'เขตลาดกระบัง',       lat: 13.7259, lon: 100.7708, risk: 'critical', rain24h: 58.3, communities: ['ชุมชนริมคลองลาดกระบัง', 'ชุมชนหลวงพ่อโอภาสี'] },
  { id: 'bkk-wta', name: 'เขตวัฒนา',           lat: 13.7332, lon: 100.5858, risk: 'moderate', rain24h: 15.4, communities: [] },
  { id: 'bkk-bkc', name: 'เขตบางแค',           lat: 13.6961, lon: 100.4099, risk: 'watch',    rain24h: 32.8, communities: ['ชุมชนริมคลองบางแค', 'ชุมชนหลังห้างบางแค'] },
  { id: 'bkk-llo', name: 'เขตหลักสี่',          lat: 13.8860, lon: 100.5446, risk: 'moderate', rain24h: 20.8, communities: [] },
  { id: 'bkk-spd', name: 'เขตสายไหม',         lat: 13.8789, lon: 100.6506, risk: 'moderate', rain24h: 21.5, communities: [] },
  { id: 'bkk-knm', name: 'เขตคันนายาว',       lat: 13.7772, lon: 100.6790, risk: 'danger',   rain24h: 45.1, communities: ['ชุมชนริมคลองคันนายาว'] },
  { id: 'bkk-sku', name: 'เขตสะพานสูง',       lat: 13.7950, lon: 100.6898, risk: 'danger',   rain24h: 46.5, communities: ['ชุมชนริมคลองสะพานสูง'] },
  { id: 'bkk-wgn', name: 'เขตวังทองหลาง',     lat: 13.7854, lon: 100.6086, risk: 'moderate', rain24h: 23.1, communities: [] },
  { id: 'bkk-kml', name: 'เขตคลองสามวา',      lat: 13.8434, lon: 100.7276, risk: 'danger',   rain24h: 42.9, communities: ['ชุมชนริมคลองสามวา'] },
  { id: 'bkk-pwt', name: 'เขตประเวศ',          lat: 13.6966, lon: 100.6716, risk: 'watch',    rain24h: 27.5, communities: ['ชุมชนริมคลองประเวศ'] },
  { id: 'bkk-brm', name: 'เขตบางนา',         lat: 13.6722, lon: 100.6130, risk: 'watch',    rain24h: 26.9, communities: ['ชุมชนริมคลองบางนา'] },
  { id: 'bkk-twt', name: 'เขตทวีวัฒนา',       lat: 13.7759, lon: 100.3959, risk: 'danger',   rain24h: 41.7, communities: ['ชุมชนริมคลองทวีวัฒนา'] },
  { id: 'bkk-tlc', name: 'เขตทุ่งครุ',        lat: 13.6288, lon: 100.4955, risk: 'watch',    rain24h: 29.4, communities: ['ชุมชนริมคลองทุ่งครุ'] },
  { id: 'bkk-bbi', name: 'เขตบางบอน',          lat: 13.6407, lon: 100.3770, risk: 'danger',   rain24h: 39.8, communities: ['ชุมชนริมคลองบางบอน'] },
  { id: 'bkk-bkd', name: 'เขตบางขุนเทียน',     lat: 13.6633, lon: 100.4300, risk: 'danger',   rain24h: 44.2, communities: ['ชุมชนริมคลองบางขุนเทียน'] },
  { id: 'bkk-bkr', name: 'เขตบางคอแหลม',      lat: 13.6934, lon: 100.5085, risk: 'moderate', rain24h: 17.8, communities: [] },
  { id: 'bkk-pwc', name: 'เขตภาษีเจริญ',      lat: 13.7211, lon: 100.4333, risk: 'watch',    rain24h: 30.1, communities: ['ชุมชนริมคลองภาษีเจริญ'] },
  { id: 'bkk-dda', name: 'เขตดินแดง',          lat: 13.7720, lon: 100.5640, risk: 'moderate', rain24h: 19.2, communities: ['ชุมชนริมคลองสามเสน'] },
  { id: 'bkk-sps', name: 'เขตสาทร',           lat: 13.7190, lon: 100.5290, risk: 'safe',     rain24h: 6.7,  communities: [] },
  { id: 'bkk-bkm', name: 'เขตบึงกุ่ม',         lat: 13.8050, lon: 100.6420, risk: 'danger',   rain24h: 37.4, communities: ['ชุมชนริมคลองบึงกุ่ม'] },
  { id: 'bkk-rbw', name: 'เขตราชวัตร',         lat: 13.7782, lon: 100.4860, risk: 'safe',     rain24h: 6.4,  communities: [] },
  { id: 'bkk-bsk', name: 'เขตบางกอกน้อย',     lat: 13.7740, lon: 100.4760, risk: 'moderate', rain24h: 16.5, communities: [] },
  { id: 'bkk-bsr', name: 'เขตบางกอกใหญ่',     lat: 13.7560, lon: 100.4915, risk: 'safe',     rain24h: 5.0,  communities: [] },
  { id: 'bkk-bkl', name: 'เขตบางพลัด',         lat: 13.7926, lon: 100.4871, risk: 'moderate', rain24h: 14.2, communities: [] },
  { id: 'bkk-bks', name: 'เขตบางซื่อ',         lat: 13.8063, lon: 100.5312, risk: 'moderate', rain24h: 18.9, communities: [] },
  { id: 'bkk-ybi', name: 'เขตยานนาวา',         lat: 13.6813, lon: 100.5364, risk: 'moderate', rain24h: 16.8, communities: [] },
  { id: 'bkk-jwt', name: 'เขตจอมทอง',         lat: 13.6586, lon: 100.4603, risk: 'watch',    rain24h: 31.2, communities: ['ชุมชนริมคลองจอมทอง'] },
  { id: 'bkk-rwb', name: 'เขตราชบูรณะ',      lat: 13.6500, lon: 100.5020, risk: 'danger',   rain24h: 38.4, communities: ['ชุมชนริมคลองราชบูรณะ'] },
  { id: 'bkk-mng', name: 'เขตมีนบุรี',         lat: 13.8120, lon: 100.7410, risk: 'danger',   rain24h: 47.3, communities: ['ชุมชนริมคลองมีนบุรี'] },
  { id: 'bkk-pkp', name: 'เขตพระโขนง',         lat: 13.7100, lon: 100.5918, risk: 'watch',    rain24h: 28.0, communities: ['ชุมชนพระโขนงใต้'] },
  { id: 'bkk-snb', name: 'เขตสนามบินน้ำ',     lat: 13.6688, lon: 100.7820, risk: 'danger',   rain24h: 43.6, communities: [] },
  { id: 'bkk-lks', name: 'เขตหลวงงสวัสดิ์',     lat: 13.7750, lon: 100.8650, risk: 'danger',   rain24h: 44.7, communities: ['ชุมชนริมคลองหลวงงสวัสดิ์'] },
  { id: 'bkk-sry', name: 'เขตศรีนครินทร์',     lat: 13.6530, lon: 100.6500, risk: 'watch',    rain24h: 25.8, communities: [] },
  { id: 'bkk-ksn', name: 'เขตคลองสาน',         lat: 13.7260, lon: 100.5100, risk: 'moderate', rain24h: 17.3, communities: [] },
  { id: 'bkk-plw', name: 'เขตปลายฝั่ง',         lat: 13.7800, lon: 100.7200, risk: 'danger',   rain24h: 40.5, communities: [] },
]

// =========================================================
// ปริมณฑล — 5 จังหวัดรอบกรุงเทพ
// =========================================================
// อำเภอ/เขตในจังหวัดปริมณฑลที่เสี่ยงน้ำท่วมบ่อย
export const PERIMETER_PROVINCES = [
  {
    id: 'non',
    name: 'นนทบุรี',
    lat: 13.8621, lon: 100.5144,
    amphure: [
      { id: 'non-mueang', name: 'อ.เมืองนนทบุรี', lat: 13.8621, lon: 100.5144 },
      { id: 'non-pakkred', name: 'อ.ปากเกร็ด',     lat: 13.9100, lon: 100.5067 },
      { id: 'non-bangsai', name: 'อ.บางใหญ่',     lat: 13.8389, lon: 100.4520 },
      { id: 'non-bangyai', name: 'อ.บางบัวทอง',    lat: 13.9056, lon: 100.4167 },
    ],
  },
  {
    id: 'pth',
    name: 'ปทุมธานี',
    lat: 14.0208, lon: 100.5250,
    amphure: [
      { id: 'pth-mueang', name: 'อ.เมืองปทุมธานี',  lat: 14.0208, lon: 100.5250 },
      { id: 'pth-rangsit', name: 'อ.ธัญบุรี',     lat: 14.0267, lon: 100.7333 },
      { id: 'pth-ladlum', name: 'อ.ลาดหลุมแก้ว', lat: 14.0230, lon: 100.4180 },
      { id: 'pth-klongluang', name: 'อ.คลองหลวง', lat: 14.0691, lon: 100.6451 },
    ],
  },
  {
    id: 'skw',
    name: 'สมุทรปราการ',
    lat: 13.5990, lon: 100.5998,
    amphure: [
      { id: 'skw-mueang', name: 'อ.เมืองสมุทรปราการ', lat: 13.5990, lon: 100.5998 },
      { id: 'skw-bangphli', name: 'อ.บางพลี',     lat: 13.6060, lon: 100.6890 },
      { id: 'skw-phrapradaeng', name: 'อ.พระประแดง', lat: 13.5900, lon: 100.5320 },
      { id: 'skw-bangbo', name: 'อ.บางบ่อ',       lat: 13.5710, lon: 100.7820 },
    ],
  },
  {
    id: 'skr',
    name: 'สมุทรสาคร',
    lat: 13.5475, lon: 100.2744,
    amphure: [
      { id: 'skr-mueang', name: 'อ.เมืองสมุทรสาคร',  lat: 13.5475, lon: 100.2744 },
      { id: 'skr-krunghan', name: 'อ.กระทุ่มแบน', lat: 13.6525, lon: 100.2605 },
      { id: 'skr-banphaeo', name: 'อ.บ้านแพ้ว',     lat: 13.5840, lon: 100.1280 },
    ],
  },
  {
    id: 'npt',
    name: 'นครปฐม',
    lat: 13.8199, lon: 100.0622,
    amphure: [
      { id: 'npt-mueang', name: 'อ.เมืองนครปฐม',  lat: 13.8199, lon: 100.0622 },
      { id: 'npt-nakhonchaisi', name: 'อ.นครชัยศรี', lat: 13.7870, lon: 100.1860 },
      { id: 'npt-samphran', name: 'อ.สามพราน',     lat: 13.7380, lon: 100.2150 },
      { id: 'npt-donthong', name: 'อ.ดอนตูม',     lat: 13.9290, lon: 100.1130 },
    ],
  },
]

// =========================================================
// เส้นถนนน้ำท่วม (Polyline)
// =========================================================
export const FLOOD_ROADS = [
  {
    id: 'road-vipavadee',
    name: 'ถนนวิภาวดีรังสิต (ช่วงดินแดง-จตุจักร)',
    severity: 'critical',
    waterLevelCm: 120,
    coordinates: [
      [13.7600, 100.5400], [13.7700, 100.5500], [13.7800, 100.5600],
      [13.7900, 100.5650], [13.8000, 100.5700], [13.8150, 100.5700],
    ],
    note: 'น้ำท่วม 60–150 ซม. สัญจรไม่ได้',
  },
  {
    id: 'road-ratchadaphisek',
    name: 'ถนนรัชดาภิเษก (ใต้ดินลอยฟ้า)',
    severity: 'critical',
    waterLevelCm: 95,
    coordinates: [
      [13.7700, 100.5600], [13.7800, 100.5700], [13.7850, 100.5800],
      [13.7900, 100.5900], [13.7950, 100.6000],
    ],
    note: 'น้ำท่วมใต้ทางลอด ~95 ซม.',
  },
  {
    id: 'road-chaengwattana',
    name: 'ถนนแจ้งวัฒนะ (ช่วงหลักสี่)',
    severity: 'caution',
    waterLevelCm: 35,
    coordinates: [
      [13.8750, 100.5300], [13.8850, 100.5400], [13.8900, 100.5500],
      [13.8950, 100.5600], [13.9050, 100.5750],
    ],
    note: 'น้ำท่วม 30–50 ซม.',
  },
  {
    id: 'road-romklao',
    name: 'ถนนร่มเกล้า (ช่วงลาดหญ้า-คลองสามวา)',
    severity: 'critical',
    waterLevelCm: 150,
    coordinates: [
      [13.7400, 100.7200], [13.7500, 100.7300], [13.7600, 100.7400],
      [13.7700, 100.7450], [13.7800, 100.7500],
    ],
    note: 'น้ำท่วมสูง 100–180 ซม.',
  },
  {
    id: 'road-sukhumvit',
    name: 'ถนนสุขุมวิท (ช่วงคลองเตย-พระโขนง)',
    severity: 'caution',
    waterLevelCm: 45,
    coordinates: [
      [13.7150, 100.5600], [13.7200, 100.5750], [13.7250, 100.5900],
      [13.7300, 100.6050], [13.7350, 100.6200],
    ],
    note: 'น้ำท่วม 25–40 ซม.',
  },
  {
    id: 'road-rama9',
    name: 'ถนนพระราม 9 (ช่วงดินแดง-ห้วยขวาง)',
    severity: 'critical',
    waterLevelCm: 80,
    coordinates: [
      [13.7550, 100.5650], [13.7650, 100.5700], [13.7750, 100.5750],
      [13.7850, 100.5800], [13.7900, 100.5850],
    ],
    note: 'น้ำท่วม ~80 ซม. (ระดับเอว)',
  },
]

// =========================================================
// Flood Zones (พื้นที่น้ำท่วมวิกฤต) — ใช้ Polygon
// =========================================================
export const FLOOD_ZONES = [
  {
    id: 'zone-romklao',
    name: 'ชุมชนร่มเกล้า ซอย 12',
    severity: 'critical',
    waterLevelCm: 120,
    coordinates: [
      [13.7600, 100.7300], [13.7600, 100.7400],
      [13.7500, 100.7400], [13.7500, 100.7300],
    ],
  },
  {
    id: 'zone-romklao2',
    name: 'ชุมชนร่มเกล้า ซอย 19',
    severity: 'critical',
    waterLevelCm: 100,
    coordinates: [
      [13.7550, 100.7450], [13.7550, 100.7550],
      [13.7450, 100.7550], [13.7450, 100.7450],
    ],
  },
  {
    id: 'zone-latkrabang',
    name: 'ชุมชนริมคลองลาดกระบัง',
    severity: 'critical',
    waterLevelCm: 150,
    coordinates: [
      [13.7300, 100.7600], [13.7400, 100.7750],
      [13.7250, 100.7800], [13.7150, 100.7650],
    ],
  },
  {
    id: 'zone-vipavadee',
    name: 'ชุมชนวิภาวดี-ลาดยาว',
    severity: 'critical',
    waterLevelCm: 110,
    coordinates: [
      [13.8150, 100.5550], [13.8250, 100.5650],
      [13.8200, 100.5750], [13.8100, 100.5650],
    ],
  },
  {
    id: 'zone-bangkae',
    name: 'ชุมชนริมคลองบางแค',
    severity: 'caution',
    waterLevelCm: 45,
    coordinates: [
      [13.7050, 100.4050], [13.7100, 100.4200],
      [13.6950, 100.4250], [13.6900, 100.4100],
    ],
  },
  {
    id: 'zone-klongtoey',
    name: 'ชุมชนคลองเตย',
    severity: 'caution',
    waterLevelCm: 35,
    coordinates: [
      [13.7150, 100.5650], [13.7200, 100.5800],
      [13.7100, 100.5850], [13.7050, 100.5700],
    ],
  },
]

// =========================================================
// Risk Meta — คำนวณ severity จาก waterLevelCm
// =========================================================
export const RISK_META = {
  safe: {
    label: 'ปกติ', color: '#10B981',
    bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  moderate: {
    label: 'ฝนปานกลาง', color: '#F59E0B',
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  watch: {
    label: 'เฝ้าระวัง', color: '#EA580C',
    bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  danger: {
    label: 'วิกฤต', color: '#DC2626',
    bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700',
    dot: 'bg-red-500',
  },
  critical: {
    label: 'วิกฤต-สัญจรไม่ได้', color: '#B91C1C',
    bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800',
    dot: 'bg-red-600',
  },
}

// =========================================================
// Water Level → Severity (ใช้ใน community system)
// =========================================================
// =========================================================
// Water Level → Status (4 ระดับมาตรฐาน)
// =========================================================
// < 10 cm       → "ปกติ"        (เขียว)
// 11-50 cm      → "สัญจรลำบาก"   (เหลือง/Amber)
// 51-80 cm      → "สัญจรไม่ได้"   (ส้ม)
// >= 81 cm      → "อพยพ"        (แดง)
//
// Tailwind class สำหรับ Badge (พร้อม bg + text + border):
export function severityFromWaterLevel(cm) {
  const v = Number(cm)

  if (v >= 81) {
    // อพยพ — แดง
    return {
      severity: 'critical',
      label: 'อพยพ',
      labelLong: '🚨 อพยพ',
      color: '#DC2626',
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
    }
  }
  if (v >= 51) {
    // สัญจรไม่ได้ — ส้ม
    return {
      severity: 'danger',
      label: 'สัญจรไม่ได้',
      labelLong: '⚠️ สัญจรไม่ได้',
      color: '#EA580C',
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-300',
    }
  }
  if (v >= 11) {
    // สัญจรลำบาก — เหลือง/Amber
    return {
      severity: 'watch',
      label: 'สัญจรลำบาก',
      labelLong: '🟡 สัญจรลำบาก',
      color: '#CA8A04',
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-300',
    }
  }
  // < 10 — ปกติ (เขียว)
  return {
    severity: 'safe',
    label: 'ปกติ',
    labelLong: '✅ ปกติ',
    color: '#10B981',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
  }
}