import { useMemo, useState } from 'react'
import { Camera, Search, MapPin, X, Wifi } from 'lucide-react'
import { CCTV_CAMERAS, CCTV_CATEGORIES } from '../data/cctv'
import CCTVPlayer from './CCTVPlayer'

/**
 * CCTVSidebar — Sidebar ขวาแสดงรายการกล้อง CCTV สาธารณะ
 *
 * props:
 *  - selectedId: string | null  (กล้องที่กำลังเล่นอยู่)
 *  - onSelect: (camera) => void  (เลือกกล้อง → ส่งให้ App เล่นใน main player)
 *  - compact?: boolean  (โหมดย่อ — ไม่แสดง player เต็ม)
 *  - onClose?: () => void
 */
export default function CCTVSidebar({ selectedId, onSelect, compact, onClose }) {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('all') // all | traffic | highway | water | weather

  // กล้องที่ filter แล้ว
  const filteredCameras = useMemo(() => {
    let list = CCTV_CAMERAS
    if (activeCat !== 'all') list = list.filter((c) => c.category === activeCat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.nameEn || '').toLowerCase().includes(q) ||
          c.source.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [search, activeCat])

  // กล้องที่เลือกอยู่
  const selectedCamera = useMemo(() => {
    return CCTV_CAMERAS.find((c) => c.id === selectedId) || null
  }, [selectedId])

  // นับจำนวนต่อ category
  const catCounts = useMemo(() => {
    const counts = { all: CCTV_CAMERAS.length }
    CCTV_CAMERAS.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1
    })
    return counts
  }, [])

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* === Header === */}
      <div className="bg-gradient-to-r from-cyan-50 to-sky-50 border-b border-cyan-100 px-3 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shadow-sm">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                📹 กล้อง CCTV สาธารณะ
              </div>
              <div className="text-[10px] text-slate-500">
                กทม. + ปริมณฑล · {CCTV_CAMERAS.length} ตัว
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
              aria-label="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* === Search === */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ค้นหากล้อง / สถานที่..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200"
          />
        </div>

        {/* === Category tabs === */}
        <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5 scrollbar-thin">
          <CatTab
            id="all"
            label="ทั้งหมด"
            count={catCounts.all}
            active={activeCat === 'all'}
            onClick={() => setActiveCat('all')}
            color="#64748B"
          />
          {Object.entries(CCTV_CATEGORIES).map(([key, m]) => (
            <CatTab
              key={key}
              id={key}
              label={`${m.icon} ${m.label}`}
              count={catCounts[key] || 0}
              active={activeCat === key}
              onClick={() => setActiveCat(key)}
              color={m.color}
            />
          ))}
        </div>
      </div>

      {/* === Active Player (ถ้าไม่ compact) === */}
      {!compact && selectedCamera && (
        <div className="p-2.5 border-b border-slate-200 bg-slate-50">
          <CCTVPlayer camera={selectedCamera} height="h-52" />
        </div>
      )}

      {/* === Camera List === */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1.5">
        {filteredCameras.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-xs text-slate-500">ไม่พบกล้องที่ค้นหา</div>
          </div>
        ) : (
          filteredCameras.map((cam) => (
            <CameraCard
              key={cam.id}
              cam={cam}
              isActive={selectedId === cam.id}
              onClick={() => onSelect && onSelect(cam)}
            />
          ))
        )}
      </div>

      {/* === Footer info === */}
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
        <div className="text-[10px] text-slate-500 leading-relaxed">
          💡 <span className="font-semibold text-slate-700">เคล็ดลับ:</span>{' '}
          กดพินกล้องบนแผนที่ หรือเลือกจากรายการนี้เพื่อเปิดดูวิดีโอ
        </div>
        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
          <Wifi className="w-2.5 h-2.5" />
          Snapshot refresh ทุก 5 วินาที · HLS ใช้ hls.js
        </div>
      </div>
    </div>
  )
}

// ===== Sub Components =====

function CatTab({ id, label, count, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md transition whitespace-nowrap flex-shrink-0 ${
        active
          ? 'bg-white shadow-sm border border-slate-200'
          : 'bg-slate-100/60 hover:bg-slate-100 text-slate-600 border border-transparent'
      }`}
      style={active ? { color } : {}}
    >
      <span>{label}</span>
      <span
        className={`text-[9px] px-1 rounded ${active ? 'bg-slate-100' : 'bg-white/50'}`}
      >
        {count}
      </span>
    </button>
  )
}

function CameraCard({ cam, isActive, onClick }) {
  const cat = CCTV_CATEGORIES[cam.category] || CCTV_CATEGORIES.traffic
  const typeLabel = {
    hls: 'HLS',
    snapshot: 'IMG',
    youtube: 'YT',
  }[cam.type] || cam.type.toUpperCase()

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-2 transition group ${
        isActive
          ? 'border-cyan-400 bg-cyan-50 ring-1 ring-cyan-200'
          : 'border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/40'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm flex-shrink-0 shadow-sm"
          style={{ background: cat.color }}
        >
          {cat.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <div className="text-xs font-semibold text-slate-900 truncate">
              {cam.name}
            </div>
            <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-500 flex-shrink-0">
              {typeLabel}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
            <span className="truncate">{cam.source}</span>
          </div>
          {cam.description && (
            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              📍 {cam.description}
            </div>
          )}
        </div>
      </div>

      {isActive && (
        <div className="mt-1.5 pt-1.5 border-t border-cyan-200 flex items-center gap-1 text-[10px] text-cyan-700 font-semibold">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
          </span>
          กำลังเล่นอยู่
        </div>
      )}
    </button>
  )
}