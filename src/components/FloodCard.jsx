import { useState, useEffect } from 'react'
import { Clock, ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react'
import { loadVotes, voteReport, loadCorrections } from '../services/communitySystem'
import { severityFromWaterLevel } from '../data/bangkok'
import { parseWaterLevelCm } from '../data/waterLevel'

export default function FloodCard({ f, onClick, isActive }) {
  // คำนวณ meta จากระดับน้ำจริง (cm) — รองรับทั้ง number และ string format
  // เช่น "สูงถึงระดับคอ (~150 ซม.)" → cm = 150 → "อพยพ" (แดง)
  const cm = parseWaterLevelCm(f.waterLevel)
  const meta = severityFromWaterLevel(cm)
  // สร้าง display string: ถ้า parse ได้ → "150 ซม.", ถ้าไม่ได้ → ใช้ข้อความเดิม
  const waterLevelDisplay = cm > 0 ? `${cm} ซม.` : (f.waterLevel || '—')
  const [vote, setVote] = useState(() => loadVotes()[f.id] || { up: 0, down: 0, userVoted: null })
  const [corrections, setCorrections] = useState(() => loadCorrections()[f.id] || [])

  useEffect(() => {
    const onStorage = () => {
      setVote(loadVotes()[f.id] || { up: 0, down: 0, userVoted: null })
      setCorrections(loadCorrections()[f.id] || [])
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [f.id])

  const handleVote = (type) => {
    const next = voteReport(f.id, type)
    setVote(next)
  }

  return (
    <div
      className={`text-left w-full rounded-xl border bg-white card-hover ${
        isActive ? `${meta.border} border} ring-1` : 'border-slate-100'
      }`}
      style={isActive ? { boxShadow: `0 0 0 2px ${meta.color}33` } : {}}
    >
      <button
        onClick={() => onClick && onClick(f)}
        className="w-full text-left p-3.5"
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: meta.color }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>
              <path d="M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>
              <path d="M2 22c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-sm text-slate-800 truncate">
                {f.name}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${meta.text} ${meta.bg} ${meta.border} border flex-shrink-0`}
              >
                {meta.label}
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              ระดับน้ำ: <span className="font-medium">{waterLevelDisplay}</span>
            </div>
            {f.note && (
              <div className="text-xs text-slate-500 mt-1 line-clamp-2">{f.note}</div>
            )}
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {f.reportedAt}
              </span>
              <span className="flex items-center gap-1 text-sky-600 font-medium">
                ซูม <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* ===== Community Verification (Vote เท่านั้น) ===== */}
      <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] text-slate-500">✓ ยืนยันความถูกต้อง</div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleVote('up') }}
              className={`text-[11px] px-2 py-1 rounded-md border transition flex items-center gap-1 font-medium ${
                vote.userVoted === 'up'
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <ThumbsUp className="w-3 h-3" /> {vote.up || 0}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleVote('down') }}
              className={`text-[11px] px-2 py-1 rounded-md border transition flex items-center gap-1 font-medium ${
                vote.userVoted === 'down'
                  ? 'bg-rose-500 border-rose-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <ThumbsDown className="w-3 h-3" /> {vote.down || 0}
            </button>
          </div>
        </div>

        {/* แสดง corrections (read-only) */}
        {corrections.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">
              📝 ข้อมูลแก้ไข ({corrections.length})
            </div>
            <div className="space-y-1">
              {corrections.slice(0, 2).map((c) => (
                <div
                  key={c.id}
                  className="text-[11px] bg-amber-50/60 border border-amber-100 rounded px-2 py-1 text-slate-700"
                >
                  <span className="font-semibold">ระดับน้ำ:</span> {c.waterLevel}
                  {c.note && <span className="ml-2 text-slate-500">— {c.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}