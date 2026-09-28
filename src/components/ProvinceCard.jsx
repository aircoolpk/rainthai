import { LEVEL_META, weatherCodeLabel } from '../services/weatherService'
import { Droplets, Thermometer, Cloud, ArrowRight } from 'lucide-react'

export default function ProvinceCard({ p, onClick, isSelected }) {
  if (p.error) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400">
        <div className="font-semibold text-slate-700">{p.name}</div>
        <div className="mt-1 text-rose-500">โหลดข้อมูลไม่สำเร็จ</div>
      </div>
    )
  }
  const meta = LEVEL_META[p.level]
  return (
    <button
      onClick={() => onClick && onClick(p)}
      className={`text-left rounded-xl border bg-white p-4 card-hover w-full ${
        isSelected
          ? 'border-sky-400 ring-2 ring-sky-200'
          : 'border-slate-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 truncate">{p.name}</div>
          <div className="text-xs text-slate-500">{p.region}</div>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${meta.text} ${meta.bg} border ${meta.border}`}
        >
          {meta.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="flex items-center justify-center text-sky-500">
            <Droplets className="w-4 h-4" />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">ฝน 24 ชม.</div>
          <div className="text-sm font-bold text-slate-800">
            {p.accumulated24h}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-center text-amber-500">
            <Thermometer className="w-4 h-4" />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">°C</div>
          <div className="text-sm font-bold text-slate-800">
            {p.temperature !== null ? Math.round(p.temperature) : '—'}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-center text-slate-400">
            <Cloud className="w-4 h-4" />
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">
            {weatherCodeLabel(p.weatherCode)}
          </div>
          <div className="text-[10px] text-slate-400">Open-Meteo</div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end text-[11px] text-sky-600 font-medium">
        drill-down <ArrowRight className="w-3 h-3 ml-1" />
      </div>
    </button>
  )
}