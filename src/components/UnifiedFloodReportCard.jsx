import { useState, useEffect } from 'react'
import { Clock, MapPin, ArrowRight, ThumbsUp, ThumbsDown, Home, Car, Lock, User, Navigation } from 'lucide-react'
import { SEVERITY_META } from '../data/provinces'
import { severityFromWaterLevel } from '../data/bangkok'
import { loadVotes, voteReport, loadCorrections } from '../services/communitySystem'

// =========================================================
// UnifiedFloodReportCard — การ์ดมาตรฐานเดียวกัน
// ใช้กับทั้ง User Reports และ Auto API
// =========================================================
// Categories: 'road' | 'housing'
const CATEGORY_META = {
  road:    { label: '🛣️ น้ำท่วมถนน',     icon: Car, color: '#F59E0B' },
  housing: { label: '🏠 ท่วมที่อยู่อาศัย',  icon: Home, color: '#EA580C' },
}

export default function UnifiedFloodReportCard({
  report,           // { id, name, waterLevel, waterLevelCm, lat, lon, reportedAt, note, category, source, votes, sourceLabel, amphure, tambon, reporter, anonymous, lastActivityAt }
  onClick,
  isActive,
  currentUser,
  onNavigate,       // optional: callback เมื่อกดปุ่มนำทาง
}) {
  // Determine category (default = road)
  const category = report.category || (report.amphure ? 'housing' : 'road')
  const catMeta = CATEGORY_META[category] || CATEGORY_META.road
  const Icon = catMeta.icon

  // Vote state
  const [vote, setVote] = useState(() => loadVotes()[report.id] || { up: 0, down: 0, userVoted: null })
  const [corrections, setCorrections] = useState(() => loadCorrections()[report.id] || [])

  useEffect(() => {
    const onStorage = () => {
      setVote(loadVotes()[report.id] || { up: 0, down: 0, userVoted: null })
      setCorrections(loadCorrections()[report.id] || [])
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [report.id])

  const handleVote = (type, e) => {
    if (e) e.stopPropagation()
    setVote(voteReport(report.id, type))
  }

  // Severity badge — คำนวณจาก waterLevelCm ตามมาตรฐาน 4 ระดับ
  // fallback ไป SEVERITY_META ถ้าไม่มี cm
  const wlMeta = (typeof report.waterLevelCm === 'number' && report.waterLevelCm >= 0)
    ? severityFromWaterLevel(report.waterLevelCm)
    : null
  const sevMeta = wlMeta || SEVERITY_META[report.severity] || SEVERITY_META.critical

  // Source badge (User vs Auto API)
  const sourceColor = report.source === 'user'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-sky-50 text-sky-700 border-sky-200'
  const sourceIcon = report.source === 'user' ? '🟢' : '🔵'

  // Navigate URL
  const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${report.lat},${report.lon}&travelmode=driving`

  return (
    <div
      onClick={() => onClick && onClick(report)}
      className={`text-left rounded-xl border card-hover cursor-pointer transition ${
        isActive
          ? `${sevMeta.border} ring-1`
          : 'border-slate-100'
      } bg-white overflow-hidden`}
      style={isActive ? { boxShadow: `0 0 0 2px ${sevMeta.color}33` } : {}}
    >
      {/* Header: badges (category + severity + source) */}
      <div className="px-3.5 pt-3 pb-2 flex items-center gap-1.5 flex-wrap">
        {/* Category badge */}
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ background: `${catMeta.color}11`, color: catMeta.color, borderColor: `${catMeta.color}55` }}>
          <Icon className="w-3 h-3" />
          {catMeta.label}
        </span>
        {/* Severity badge */}
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${sevMeta.text} ${sevMeta.bg} ${sevMeta.border} border`}>
          {sevMeta.label}
        </span>
        {/* Source badge */}
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${sourceColor} ml-auto`}>
          {sourceIcon} {report.sourceLabel}
        </span>
      </div>

      {/* Body */}
      <div className="px-3.5 pb-3">
        <div className="font-semibold text-sm text-slate-800 truncate">
          {report.name}
        </div>

        {/* Level meta */}
        <div className="text-xs text-slate-600 mt-1">
          ระดับน้ำ: <span className="font-medium">{report.waterLevel}</span>
        </div>

        {/* Location meta */}
        {(report.amphure || report.tambon) && (
          <div className="text-[11px] text-slate-500 mt-1 flex items-start gap-1">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span className="trtruncate">
              {report.amphure}{report.tambon ? ` · ${report.tambon}` : ''}
            </span>
          </div>
        )}

        {report.note && (
          <div className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{report.note}</div>
        )}

        {/* Reporter (only for user reports) */}
        {report.source === 'user' && (
          <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
            {report.anonymous ? (
              <><Lock className="w-3 h-3" /> ไม่ระบุตัวตน</>
            ) : report.reporter ? (
              <><User className="w-3 h-3" /> {report.reporter}</>
            ) : null}
            <span className="mx-1">·</span>
            <Clock className="w-3 h-3" />
            {report.reportedAt}
          </div>
        )}

        {report.source !== 'user' && (
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {report.reportedAt}
            </span>
            <span className="flex items-center gap-1 text-sky-600 font-medium">
              ดูแผนที่ <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        )}
      </div>

      {/* Footer: Vote + Navigate */}
      <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => handleVote('up', e)}
            className={`text-[11px] px-2 py-1 rounded-md border flex items-center gap-1 font-medium transition ${
              vote.userVoted === 'up'
                ? 'bg-emerald-500 border-emerald-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <ThumbsUp className="w-3 h-3" />
            {vote.up || 0}
          </button>
          <button
            onClick={(e) => handleVote('down', e)}
            className={`text-[11px] px-2 py-1 rounded-md border flex items-center gap-1 font-medium transition ${
              vote.userVoted === 'down'
                ? 'bg-rose-500 border-rose-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <ThumbsDown className="w-3 h-3" />
            {vote.down || 0}
          </button>
        </div>

        <a
          href={navigateUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold transition"
          title="เปิด Google Maps นำทางไปยังจุดนี้"
        >
          <Navigation className="w-3 h-3" />
          นำทาง
        </a>
      </div>
    </div>
  )
}