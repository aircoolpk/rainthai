import { Clock, Users, Phone, Lock, CheckCircle2, AlertTriangle, MapPin, Navigation, Car } from 'lucide-react'
import { waitingDuration } from '../services/communitySystem'

// =========================================================
// SOSCaseCard — การ์ดเคส SOS มาตรฐานเดียวกัน (Standardized UI)
// + เพิ่ม category badge + navigate button + owner-only resolve
// =========================================================
const CATEGORY_META = {
  road:     { label: '🛣️ น้ำท่วมถนน',     color: '#F59E0B', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  housing:  { label: '🏠 ท่วมที่อยู่อาศัย',  color: '#DC2626', bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
  medical:  { label: '🏥 ฉุกเฉิน/เจ็บป่วย', color: '#B91C1C', bg: 'bg-red-100',    text: 'text-red-800',     border: 'border-red-300' },
  other:    { label: '⚠️ อื่นๆ',            color: '#6B7280', bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200' },
}

export default function SOSCaseCard({
  c,
  onResolve,
  onClick,
  districts = {},
  currentUser = null,
  showResolve = false,
}) {
  const isResolved = c.status === 'resolved' || c.status === 'auto-resolved'
  const districtName = districts[c.district] || c.district
  const catMeta = CATEGORY_META[c.category] || CATEGORY_META.other
  const createdBy = c.createdByDisplay || c.createdByUsername || c.createdBy

  // ตรวจว่า user นี้เป็นเจ้าของเคส
  const isOwner = currentUser && (
    c.createdBy === currentUser.id ||
    c.createdByUsername === currentUser.username
  )

  // Navigate URL (Google Maps Directions)
  const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}&travelmode=driving`

  const handleClick = () => onClick && onClick(c)

  return (
    <div
      className={`rounded-xl border bg-white p-4 transition cursor-pointer ${
        isResolved
          ? 'border-emerald-200 bg-emerald-50/50'
          : 'border-red-200 bg-red-50/40 hover:shadow-md hover:border-red-300'
      }`}
      onClick={handleClick}
    >
      {/* Header: category + status + เวลารอ */}
      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Category badge */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catMeta.bg} ${catMeta.text} ${catMeta.border}`}>
            {catMeta.label}
          </span>
          {/* Status */}
          {isResolved ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              ช่วยแล้ว
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full" />
              รอความช่วยเหลือ
            </span>
          )}
        </div>
        {!isResolved && (
          <div className="text-[11px] text-red-700 font-semibold flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            <Clock className="w-3 h-3" />
            รอมาแล้ว {waitingDuration(c.reportedAt)}
          </div>
        )}
      </div>

      {/* Title */}
      <div className="font-semibold text-sm text-slate-900 line-clamp-2 mb-2">
        {c.name}
      </div>

      {/* Meta */}
      <div className="space-y-1 text-[11px] text-slate-600">
        {districtName && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            {districtName}
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            {c.people} คน
          </span>
          {c.contact && (
            <a
              href={`tel:${String(c.contact).replace(/[^\d+]/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
            >
              <Phone className="w-3 h-3" />
              {c.contact}
            </a>
          )}
        </div>
        {c.note && (
          <div className="text-slate-500 mt-1 line-clamp-2 leading-relaxed">{c.note}</div>
        )}
        {createdBy && (
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            โดย: {createdBy}
            {isOwner && <span className="text-sky-600 font-semibold"> (คุณ)</span>}
          </div>
        )}
      </div>

      {/* Footer: ปุ่มนำทาง + ปุ่มช่วยเหลือ (เฉพาะ owner) */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
        {/* ปุ่มนำทาง Google Maps */}
        <a
          href={navigateUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-md bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold transition"
          title="เปิด Google Maps นำทางไปยังจุดเกิดเหตุ"
        >
          <Navigation className="w-3 h-3" />
          นำทาง
        </a>

        {/* ปุ่มปักหมุดบนแผนที่ */}
        <button
          onClick={(e) => { e.stopPropagation(); handleClick() }}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold transition"
        >
          <MapPin className="w-3 h-3" />
          ปักหมุด
        </button>

        {/* ✅ ปุ่มได้รับความช่วยเหลือแล้ว — เฉพาะ owner */}
        {!isResolved && showResolve && isOwner && (
          <button
            onClick={(e) => { e.stopPropagation(); onResolve && onResolve(c.id) }}
            className="flex-1 min-w-[140px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-1.5 px-2 rounded-md transition flex items-center justify-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            ได้รับความช่วยเหลือแล้ว
          </button>
        )}

        {!isResolved && showResolve && !isOwner && (
          <div className="flex-1 min-w-[140px] text-[10px] text-slate-400 italic flex items-center justify-end gap-1">
            <Lock className="w-3 h-3" />
            เฉพาะเจ้าของเคส
          </div>
        )}
      </div>

      {isResolved && c.status === 'auto-resolved' && (
        <div className="mt-2 text-[10px] text-amber-700 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          หมดเวลาอัตโนมัติ (24 ชม.)
        </div>
      )}
    </div>
  )
}