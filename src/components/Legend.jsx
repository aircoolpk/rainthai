import { severityFromWaterLevel } from '../data/bangkok'

export default function Legend() {
  // ดึง meta ของแต่ละระดับมาใช้กับ Legend (single source of truth)
  const levels = [
    severityFromWaterLevel(0),     // ปกติ (เขียว)
    severityFromWaterLevel(30),    // สัญจรลำบาก (เหลือง)
    severityFromWaterLevel(65),    // สัญจรไม่ได้ (ส้ม)
    severityFromWaterLevel(100),   // อพยพ (แดง)
  ]

  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100">
      <div className="text-sm font-semibold text-slate-800 mb-2">
        สัญลักษณ์ระดับน้ำท่วม (4 ระดับ)
      </div>
      <ul className="space-y-1.5">
        {levels.map((lv) => (
          <li key={lv.severity} className="flex items-center gap-2 text-xs">
            <span
              className={`inline-block w-6 h-1.5 rounded-full border ${lv.border}`}
              style={{ background: lv.color }}
            />
            <span className="text-slate-700">{lv.labelLong}</span>
          </li>
        ))}
        <li className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} />
          <span className="text-slate-700">📍 หมุดที่ผู้ใช้แจ้ง (สีตามระดับน้ำ)</span>
        </li>
      </ul>
      <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
        <div>💡 ระดับความรุนแรงคำนวณจากระดับน้ำ (cm) โดยตรง</div>
        <div className="text-[10px] text-slate-400">
          &lt;10 ปกติ · 11–50 สัญจรลำบาก · 51–80 สัญจรไม่ได้ · ≥81 อพยพ
        </div>
      </div>
    </div>
  )
}