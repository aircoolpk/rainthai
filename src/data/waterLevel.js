// =========================================================
// Water Level Parser — robust helper for mixed input
// =========================================================
// รับได้ทั้ง:
//   - number (numeric): e.g. 150, 80, 15
//   - string with "~N cm": "สูงถึงระดับคอ (~150 ซม.)"
//   - string with bare N: "150"
//   - string in Thai body-part vocabulary: "ระดับข้อเท้า", "สูงระดับเข่า"
//   - string with extra noise: "ระดับเอว (~80 ซม.) — สัญจรไม่ได้"
//
// คืนค่าเป็นตัวเลข cm (Number) เสมอ หรือ 0 ถ้าแปลงไม่ได้
//
// ใช้ร่วมกับ severityFromWaterLevel() → ได้ status label/สี

// ---------- Body-part vocabulary (ระดับความสูงจากพื้น) ----------
// ใช้ .includes() แทน regex word boundary (Unicode-safe, robust)
// sort จาก "ใหญ่" → "เล็ก" เพื่อ match ก่อน (เช่น "หัวเข่า" มาก่อน "เข่า")
const BODY_PART_CM = [
  { word: 'คอ',         cm: 150 },
  { word: 'อก',         cm: 120 },
  { word: 'เอว',        cm: 80 },
  { word: 'หัวเข่า',    cm: 50 },
  { word: 'เข่า',       cm: 50 },
  { word: 'หน้าแข้ง',   cm: 35 },
  { word: 'แข้ง',       cm: 35 },
  { word: 'ข้อเท้า',    cm: 15 },
  { word: 'เท้า',       cm: 15 },
  { word: 'ตาตุ่ม',     cm: 15 },
]

export function parseWaterLevelCm(value) {
  if (value === null || value === undefined) return 0
  // Case 1: number → ใช้เลย
  if (typeof value === 'number' && Number.isFinite(value)) return value

  // Case 2: string → สกัดตัวเลข
  const str = String(value).trim()
  if (!str) return 0

  // Step A: หา "(~N cm)" pattern แบบ explicit
  const cmMatch = str.match(/\(?\s*~?\s*(\d+(?:\.\d+)?)\s*(?:ซ\.?ม\.?|cm|เซนติเมตร)\s*\)?/i)
  if (cmMatch) {
    return parseFloat(cmMatch[1])
  }

  // Step B: หาตัวเลขลอยๆ ในข้อความ (เผื่อ format แปลก)
  const numMatch = str.match(/(\d+(?:\.\d+)?)/)
  if (numMatch) {
    return parseFloat(numMatch[1])
  }

  // Step C: fallback ดู Thai body-part vocabulary (เช่น "ระดับข้อเท้า" → 15)
  for (const { word, cm } of BODY_PART_CM) {
    if (str.includes(word)) return cm
  }

  // ไม่เจออะไรเลย → ปกติ (0 cm)
  return 0
}

// Helper: คำนวณ status จาก waterLevel field (mixed type)
import { severityFromWaterLevel } from './bangkok'

export function statusFromWaterLevelValue(value) {
  const cm = parseWaterLevelCm(value)
  return severityFromWaterLevel(cm)
}