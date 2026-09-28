import { useEffect, useState } from 'react'
import { Siren, X, MapPin, Users, Phone, AlertTriangle, History, Lock, CheckCircle2 } from 'lucide-react'
import {
  activeSOS, applyAutoExpire, saveSOSCases, loadSOSCases, waitingDuration,
} from '../services/communitySystem'
import SOSCaseCard from './SOSCaseCard'

// ----- form categories -----
const CATEGORIES = [
  { id: 'road',    label: '🛣️ น้ำท่วมถนน',     desc: 'ถนนท่วม/รถติด/ปิดเส้นทาง' },
  { id: 'housing', label: '🏠 ท่วมที่อยู่อาศัย',  desc: 'น้ำท่วมบ้าน/อาคาร' },
  { id: 'medical', label: '🏥 ฉุกเฉิน/เจ็บป่วย', desc: 'ผู้ป่วย/เจ็บป่วย/บาดเจ็บ' },
  { id: 'other',   label: '⚠️ อื่นๆ',            desc: 'เหตุฉุกเฉินอื่นๆ' },
]

// รายการ districts สำหรับ lookup (mock)
const DISTRICTS_BY_ID = {
  'bkk-pkn': 'เขตพระนคร', 'bkk-rkl': 'เขตร่มเกล้า', 'bkk-lkb': 'เขตลาดกระบัง',
  'bkk-jtc': 'เขตจตุจักร', 'bkk-hkw': 'เขตห้วยขวาง', 'bkk-twt': 'เขตทวีวัฒนา',
  'bkk-bkc': 'เขตบางแค',   'bkk-mng': 'เขตมีนบุรี',
}

export default function SOSModal({ onClose, onJumpToFlood, onOpenVote, currentUser }) {
  const [cases, setCases] = useState(() => applyAutoExpire(loadSOSCases()))
  const [showForm, setShowForm] = useState(false)
  const [showResolved, setShowResolved] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setCases(applyAutoExpire(loadSOSCases()))
    }, 60 * 1000)
    return () => clearInterval(t)
  }, [])

  const handleResolve = (id) => {
    const next = cases.map((c) =>
      c.id === id ? { ...c, status: 'resolved', resolvedAt: new Date().toISOString() } : c,
    )
    saveSOSCases(next)
    setCases(next)
  }

  const handleResend = (c) => {
    const next = cases.map((x) =>
      x.id === c.id
        ? { ...x, reportedAt: new Date().toISOString(), status: 'active' }
        : x,
    )
    saveSOSCases(next)
    setCases(next)
  }

  const addCase = (payload) => {
    if (!currentUser) return
    const now = new Date().toISOString()
    const newCase = {
      id: `sos-new-${Date.now()}`,
      reportedAt: now,
      status: 'active',
      createdBy: currentUser.id,
      createdByUsername: currentUser.username,
      createdByDisplay: currentUser.displayName || currentUser.username,
      ...payload,
    }
    const next = [newCase, ...cases]
    saveSOSCases(next)
    setCases(next)
    setShowForm(false)
  }

  const live     = activeSOS(cases)
  const resolved = cases.filter((c) => c.status === 'resolved' || c.status === 'auto-resolved')

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-red-50 via-white to-orange-50 rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <Siren className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                🚨 ศูนย์รวมเคสขอความช่วยเหลือ
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </h2>
              <div className="text-xs text-slate-500">
                {live.length} เคสกำลังรอ · {resolved.length} ช่วยแล้ว · {cases.length} ทั้งหมด
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!showForm ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (!currentUser) {
                    onOpenVote && onOpenVote('login-required', { action: 'sos' })
                    return
                  }
                  setShowForm(true)
                }}
                className="flex-1 min-w-[180px] bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
              >
                {currentUser ? (
                  <><Siren className="w-5 h-5" /> 🚨 กดขอความช่วยเหลือ</>
                ) : (
                  <><Lock className="w-4 h-4" /> 🔐 ล็อกอินเพื่อขอความช่วยเหลือ</>
                )}
              </button>
              <button
                onClick={() => setShowResolved(true)}
                className="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold py-3 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2"
              >
                <History className="w-4 h-4" />
                📜 ดูเคสที่ได้รับการช่วยเหลือแล้ว
                <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">{resolved.length}</span>
              </button>
            </div>
          ) : (
            <SOSForm
              onCancel={() => setShowForm(false)}
              onSubmit={addCase}
              districts={DISTRICTS_BY_ID}
              currentUser={currentUser}
            />
          )}

          {/* เคส active (ซ่อนเคสที่ช่วยแล้วจากหน้าแรก) */}
          {!showResolved && (
            <section>
              <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                เคสที่กำลังรอ ({live.length})
              </h3>
              {live.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center bg-slate-50 rounded-lg">
                  ✅ ขณะนี้ไม่มีเคสค้าง — ทุกคนปลอดภัย
                </div>
              ) : (
                <div className="space-y-2">
                  {live.map((c) => (
                    <SOSCaseCard
                      key={c.id}
                      c={c}
                      districts={DISTRICTS_BY_ID}
                      currentUser={currentUser}
                      showResolve
                      onResolve={handleResolve}
                      onClick={(x) => onJumpToFlood && onJumpToFlood(x)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* เคสที่ช่วยแล้ว — แสดงเมื่อ toggle */}
          {showResolved && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  เคสที่ช่วยเหลือสำเร็จแล้ว ({resolved.length})
                </h3>
                <button
                  onClick={() => setShowResolved(false)}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  ← กลับไปดูเคสที่กำลังรอ
                </button>
              </div>
              {resolved.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center bg-slate-50 rounded-lg">
                  ยังไม่มีเคสที่สำเร็จ
                </div>
              ) : (
                <div className="space-y-2">
                  {resolved.map((c) => (
                    <SOSCaseCard
                      key={c.id}
                      c={c}
                      districts={DISTRICTS_BY_ID}
                      currentUser={currentUser}
                      onClick={(x) => onJumpToFlood && onJumpToFlood(x)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>สายด่วน: 1784 · 1669</span>
          <span>⏱️ เคสหมดอายุอัตโนมัติใน 24 ชม.</span>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// SOS Form — สำหรับแจ้งเคสใหม่
// =====================================================
function SOSForm({ onSubmit, onCancel, districts, currentUser }) {
  const [name, setName]     = useState('')
  const [category, setCategory] = useState('road')
  const [district, setDist] = useState('')
  const [lat, setLat]       = useState('')
  const [lon, setLon]       = useState('')
  const [people, setPeople] = useState('1')
  const [contact, setContact] = useState(currentUser?.phone || '')
  const [note, setNote]     = useState('')

  const useGPS = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLon(pos.coords.longitude.toFixed(6))
      },
      () => alert('ไม่สามารถเข้าถึงตำแหน่งได้'),
    )
  }

  const submit = () => {
    if (!name.trim() || !contact.trim()) {
      alert('กรุณากรอกชื่อเหตุและเบอร์ติดต่อ')
      return
    }
    onSubmit({
      name: name.trim(),
      category,
      district: district || 'bkk-pkn',
      lat: parseFloat(lat) || 13.7563,
      lon: parseFloat(lon) || 100.5018,
      people: parseInt(people, 10) || 1,
      contact: contact.trim(),
      note: note.trim(),
    })
  }

  return (
    <div className="border border-red-200 rounded-xl p-4 bg-white space-y-3 animate-slide-up">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <Siren className="w-4 h-4 text-red-600" />
        แจ้งเคสขอความช่วยเหลือ
      </h3>

      {/* Category selector */}
      <div>
        <div className="text-[11px] font-semibold text-slate-600 mb-1.5">หมวดหมู่เหตุ</div>
        <div className="grid grid-cols-2 gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`text-left text-xs px-3 py-2 rounded-lg border transition ${
                category === c.id
                  ? 'border-red-400 bg-red-50 text-red-800 font-semibold ring-1 ring-red-200'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
              }`}
            >
              <div>{c.label}</div>
              <div className="text-[10px] text-slate-500 font-normal">{c.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <Field label="ชื่อเหตุ / สถานการณ์" required>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น ผู้ประสบภัยติดอยู่ในบ้าน"
          className="form-input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="เขต">
          <select
            value={district}
            onChange={(e) => setDist(e.target.value)}
            className="form-input"
          >
            <option value="">— เลือกเขต —</option>
            {Object.entries(districts).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </Field>
        <Field label="จำนวนคน">
          <input
            type="number"
            min="1"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            className="form-input"
          />
        </Field>
      </div>
      <Field label="เบอร์ติดต่อ" required>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="081-234-5678"
          className="form-input"
        />
      </Field>
      <Field label="ตำแหน่ง (กดปุ่มเพื่อใช้ GPS)">
        <div className="flex gap-2">
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="ละติจูด"
            className="flex-1 form-input"
          />
          <input
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            placeholder="ลองจิจูด"
            className="flex-1 form-input"
          />
          <button
            type="button"
            onClick={useGPS}
            className="px-3 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-medium"
          >
            📍 GPS
          </button>
        </div>
      </Field>
      <Field label="หมายเหตุเพิ่มเติม">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="รายละเอียดเพิ่มเติม"
          className="form-input resize-none"
        />
      </Field>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium"
        >
          ยกเลิก
        </button>
        <button
          onClick={submit}
          className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold"
        >
          🚨 ส่งขอความช่วยเหลือ
        </button>
      </div>

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
          border-color: #DC2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
        }
      `}</style>
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