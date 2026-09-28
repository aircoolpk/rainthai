import { X, ChevronRight, MapPin, Droplets, Home, AlertTriangle } from 'lucide-react'
import { RISK_META } from '../data/bangkok'

export default function DistrictPanel({ district, onClose, onFocus }) {
  if (!district) return null
  const meta = RISK_META[district.risk]
  return (
    <aside className="bg-white w-full md:w-full flex flex-col h-full animate-slide-up">
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3"
        style={{ background: `linear-gradient(to bottom, ${meta.color}15, #ffffff)` }}
      >
        <div className="min-w-0">
          <div
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: meta.color }}
          >
            เขตในกรุงเทพมหานคร
          </div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            {district.name}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
              style={{ background: meta.color }}
            >
              {meta.label}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              <b>{district.rain24h} มม.</b>
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
          aria-label="ปิด"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* สถิติ */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-500" />
            ข้อมูลเขต
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="พิกัด" value={`${district.lat.toFixed(4)}, ${district.lon.toFixed(4)}`} />
            <Stat label="ฝน 24 ชม." value={`${district.rain24h} มม.`} highlight />
            <Stat label="ระดับความเสี่ยง" value={meta.label} color={meta.color} />
            <Stat label="ชุมชนที่ท่วม" value={`${district.communities?.length || 0} จุด`} />
          </div>
        </section>

        {/* ชุมชนที่ท่วมขัง */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
            <Home className="w-4 h-4 text-slate-500" />
            รายชื่อชุมชนที่ท่วมขัง
            <span className="text-[10px] font-normal text-slate-400 ml-1">
              ({district.communities?.length || 0})
            </span>
          </h3>
          {district.communities?.length > 0 ? (
            <div className="space-y-1.5">
              {district.communities.map((c) => (
                <div
                  key={c}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-red-50 border border-red-100"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700 truncate">{c}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-md">
              ไม่มีรายงานชุมชนที่ท่วมขัง
            </div>
          )}
        </section>

        {/* Footer hint */}
        <div className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
          💡 ข้อมูลนี้เป็น mockup สำหรับสาธิต feature สามารถต่อยอดด้วย
          API รายงานสถานการณ์จริงจากหน่วยงานภาครัฐได้
        </div>
      </div>
    </aside>
  )
}

function Stat({ label, value, color, highlight }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-md p-2.5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div
        className={`text-sm font-bold mt-0.5 ${
          highlight ? 'text-sky-700' : 'text-slate-800'
        }`}
        style={color ? { color } : undefined}
      >
        {value}
      </div>
    </div>
  )
}