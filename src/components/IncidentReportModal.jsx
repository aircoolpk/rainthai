import { useState, useMemo } from 'react'
import { X, Megaphone, MapPin, Droplets, User, Phone, Lock, CheckCircle2, Crosshair, Loader2 } from 'lucide-react'
import { BKK_DISTRICTS, PERIMETER_PROVINCES, severityFromWaterLevel } from '../data/bangkok'
import { addIncident } from '../services/incidentSystem'

// ระดับน้ำ guide presets — ตรงกับมาตรฐาน 4 ระดับ (<10 / 11-50 / 51-80 / ≥81)
const WATER_LEVEL_PRESETS = [
  { cm: 15,  label: '10–20 ซม.', desc: 'ระดับข้อเท้า / รถผ่านได้ปกติ',         color: '#10B981' },
  { cm: 40,  label: '30–50 ซม.', desc: 'ระดับหน้าแข้ง-หัวเข่า / รถเล็กควรระวัง', color: '#CA8A04' },
  { cm: 65,  label: '51–80 ซม.', desc: 'ระดับเอว / สัญจรไม่ได้',                color: '#EA580C' },
  { cm: 100, label: '≥81 ซม.',  desc: 'ระดับอก-คอ / อพยพ / วิกฤต',           color: '#DC2626' },
]

export default function IncidentReportModal({ onClose, onSubmitted, currentUser }) {
  if (!currentUser) {
    // Should not happen if caller enforces login, but guard anyway
    return null
  }
  const [province, setProvince] = useState('bkk')
  const [district, setDistrict] = useState('bkk-pkn')
  const [amphure, setAmphure]   = useState('เขตพระนคร')
  const [tambon, setTambon]     = useState('')
  const [road, setRoad]         = useState('')
  const [waterCm, setWaterCm]   = useState(35)
  const [reporter, setReporter] = useState(currentUser.displayName || currentUser.username || '')
  const [phone, setPhone]       = useState(currentUser.phone || '')
  const [anonymous, setAnon]    = useState(false)
  const [note, setNote]         = useState('')
  const [category, setCategory] = useState('road')
  const [lat, setLat]           = useState('')
  const [lon, setLon]           = useState('')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState(null)

  // districts ทั้งหมด (รวม กทม + ปริมณฑล)
  const allDistricts = useMemo(() => {
    const list = [
      ...BKK_DISTRICTS.map((d) => ({
        id: d.id, name: d.name, lat: d.lat, lon: d.lon, parentId: 'bkk', parentName: 'กรุงเทพมหานคร',
      })),
      ...PERIMETER_PROVINCES.flatMap((p) =>
        p.amphure.map((a) => ({
          id: a.id, name: a.name, lat: a.lat, lon: a.lon, parentId: p.id, parentName: p.name,
        })),
      ),
    ]
    return list
  }, [])

  const selectedDistrict = allDistricts.find((d) => d.id === district)

  const guideMeta = severityFromWaterLevel(waterCm)

  // ดึงพิกัด GPS
  const useGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('เบราว์เซอร์ไม่รองรับ GPS')
      return
    }
    setGpsLoading(true)
    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLon(pos.coords.longitude.toFixed(6))
        setGpsLoading(false)
      },
      (err) => {
        setGpsLoading(false)
        setGpsError(
          err.code === 1 ? 'ผู้ใช้ปฏิเสธการเข้าถึงตำแหน่ง' :
          err.code === 2 ? 'ไม่สามารถระบุตำแหน่งได้' :
          'เกิดข้อผิดพลาดในการดึงตำแหน่ง',
        )
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }

  const submit = () => {
    if (!road.trim()) {
      alert('กรุณากรอกชื่อถนน/ชุมชน')
      return
    }
    if (!tambon.trim()) {
      alert('กรุณากรอกชื่อแขวง/ตำบล')
      return
    }
    if (!anonymous && (!reporter.trim() || !phone.trim())) {
      alert('กรุณากรอกชื่อและเบอร์โทร หรือเลือก "ไม่ระบุตัวตน"')
      return
    }

    // ใช้ GPS lat/lon ถ้ามี ไม่งั้น fallback ตำแหน่งเขต
    const finalLat = lat.trim() ? Number(lat) : (selectedDistrict?.lat || 13.7563)
    const finalLon = lon.trim() ? Number(lon) : (selectedDistrict?.lon || 100.5018)

    addIncident({
      province,
      district,
      amphure: amphure.trim() || (selectedDistrict?.name || ''),
      tambon: tambon.trim(),
      road: road.trim(),
      waterLevelCm: Number(waterCm),
      category,
      note: note.trim(),
      reporter: anonymous ? null : reporter.trim(),
      phone:    anonymous ? null : phone.trim(),
      anonymous,
      createdBy: currentUser.id,
      createdByUsername: currentUser.username,
      createdByDisplay: currentUser.displayName || currentUser.username,
      lat: finalLat,
      lon: finalLon,
    })

    onSubmitted && onSubmitted()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 via-white to-orange-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                📢 แจ้งเหตุน้ำท่วม / จุดเฝ้าระวัง
              </h2>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                แจ้งโดย: <b className="text-amber-700">{currentUser.displayName || currentUser.username}</b>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* ==== หมวดหมู่ ==== */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
              📋 หมวดหมู่
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('road')}
                className={`text-left px-3 py-2 rounded-lg border-2 transition ${
                  category === 'road'
                    ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-semibold text-slate-800">🛣️ น้ำท่วมถนน</div>
                <div className="text-[10px] text-slate-500">ถนนท่วม/รถติด/ปิดเส้นทาง</div>
              </button>
              <button
                type="button"
                onClick={() => setCategory('housing')}
                className={`text-left px-3 py-2 rounded-lg border-2 transition ${
                  category === 'housing'
                    ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-semibold text-slate-800">🏠 ท่วมที่อยู่อาศัย</div>
                <div className="text-[10px] text-slate-500">น้ำท่วมบ้าน/อาคาร</div>
              </button>
            </div>
          </section>

          {/* ==== สถานที่ ==== */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-2.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" />
              สถานที่เกิดเหตุ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="จังหวัด">
                <select
                  value={province}
                  onChange={(e) => {
                    setProvince(e.target.value)
                    // reset district
                    if (e.target.value === 'bkk') {
                      setDistrict('bkk-pkn')
                      setAmphure('เขตพระนคร')
                    } else {
                      const p = PERIMETER_PROVINCES.find((x) => x.id === e.target.value)
                      if (p && p.amphure[0]) {
                        setDistrict(p.amphure[0].id)
                        setAmphure(p.amphure[0].name)
                      }
                    }
                  }}
                  className="form-input"
                >
                  <option value="bkk">กรุงเทพมหานคร</option>
                  {PERIMETER_PROVINCES.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="เขต / อำเภอ">
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value)
                    const d = allDistricts.find((x) => x.id === e.target.value)
                    setAmphure(d?.name || '')
                  }}
                  className="form-input"
                >
                  {province === 'bkk' ? (
                    <>
                      <optgroup label="— กรุงเทพมหานคร (50 เขต) —">
                        {BKK_DISTRICTS.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </optgroup>
                    </>
                  ) : (
                    PERIMETER_PROVINCES.find((p) => p.id === province)?.amphure.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))
                  )}
                </select>
              </Field>
              <Field label="แขวง / ตำบล">
                <input
                  value={tambon}
                  onChange={(e) => setTambon(e.target.value)}
                  placeholder="เช่น แขวงลาดยาว"
                  className="form-input"
                />
              </Field>
              <Field label="ชื่อถนน / ชุมชน">
                <input
                  value={road}
                  onChange={(e) => setRoad(e.target.value)}
                  placeholder="เช่น ถนนวิภาวดีรังสิต ซอย 5"
                  className="form-input"
                />
              </Field>
            </div>
          </section>

          {/* ==== ระดับน้ำ ==== */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-2.5 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-slate-500" />
              ระดับน้ำท่วมโดยประมาณ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3">
              {WATER_LEVEL_PRESETS.map((p) => (
                <button
                  key={p.cm}
                  type="button"
                  onClick={() => setWaterCm(p.cm)}
                  className={`text-left px-3 py-2 rounded-lg border transition ${
                    waterCm === p.cm
                      ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-800">{p.label}</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
                      style={{ background: p.color }}
                    >
                      {severityFromWaterLevel(p.cm).label.split(' ')[1] || ''}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>

            <Field label="ระบุเป็นตัวเลข (ซม.)">
              <input
                type="number"
                min="0"
                max="300"
                value={waterCm}
                onChange={(e) => setWaterCm(e.target.value)}
                className="form-input"
              />
            </Field>

            {/* Live preview tag */}
            <div className="mt-3 px-3 py-2 rounded-lg border-2 flex items-center justify-between" style={{ borderColor: guideMeta.color, background: `${guideMeta.color}11` }}>
              <div className="text-xs text-slate-700">ระดับน้ำ {waterCm} ซม.</div>
              <div
                className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded text-white"
                style={{ background: guideMeta.color }}
              >
                {guideMeta.label}
              </div>
            </div>
          </section>

          {/* ==== ผู้แจ้ง ==== */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-2.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              ข้อมูลผู้แจ้ง
            </h3>

            <label className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnon(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-700 font-medium">
                🔒 ไม่เปิดเผยข้อมูลผู้แจ้ง (แจ้งแบบไม่ระบุตัวตน)
              </span>
            </label>

            {!anonymous && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="ชื่อผู้แจ้ง">
                  <input
                    value={reporter}
                    onChange={(e) => setReporter(e.target.value)}
                    placeholder="เช่น สมชาย"
                    className="form-input"
                  />
                </Field>
                <Field label="เบอร์โทร">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081-xxx-xxxx"
                    className="form-input"
                  />
                </Field>
              </div>
            )}
          </section>

          {/* ==== พิกัด GPS (optional) ==== */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500" />
                พิกัดตำแหน่ง (ไม่บังคับ)
              </h3>
              <button
                type="button"
                onClick={useGPS}
                disabled={gpsLoading}
                className="inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 border border-sky-200 text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-md transition"
              >
                {gpsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5" />
                )}
                {gpsLoading ? 'กำลังดึง...' : '📍 ดึงพิกัดปัจจุบัน (GPS)'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitude">
                <input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="เช่น 13.7563"
                  className="form-input font-mono text-sm"
                />
              </Field>
              <Field label="Longitude">
                <input
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  placeholder="เช่น 100.5018"
                  className="form-input font-mono text-sm"
                />
              </Field>
            </div>
            {gpsError && (
              <div className="mt-2 text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-2 py-1">
                ⚠️ {gpsError}
              </div>
            )}
            {!gpsError && (lat || lon) && (
              <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
                ✓ ได้พิกัดแล้ว — ระบบจะปักหมุดตรงนี้บนแผนที่
              </div>
            )}
            <div className="mt-1 text-[10px] text-slate-400">
              💡 ถ้าไม่กรอก ระบบจะใช้ตำแหน่งกลางของเขต/อำเภอที่เลือกไว้
            </div>
          </section>

          {/* ==== หมายเหตุ ==== */}
          <section>
            <Field label="หมายเหตุเพิ่มเติม">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="เช่น น้ำท่วมตั้งแต่เช้า, มีรถติด, ถนนปิด ฯลฯ"
                className="form-input resize-none"
              />
            </Field>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={submit}
            className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
          >
            <Megaphone className="w-4 h-4" />
            ส่งข้อมูล — ปักหมุดบนแผนที่
          </button>
        </div>

        {/* CSS class for inputs */}
        <style>{`
          .form-input {
            width: 100%;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #E2E8F0;
            background: white;
            font-size: 14px;
            color: #0F172A;
            outline: none;
            transition: border 0.15s, box-shadow 0.15s;
          }
          .form-input:focus {
            border-color: #F59E0B;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
          }
        `}</style>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <div className="text-[11px] font-semibold text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      {children}
    </label>
  )
}