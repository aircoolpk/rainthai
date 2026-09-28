import { severityFromWaterLevel } from '../data/bangkok'

export default function Legend() {
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100">
      <div className="text-sm font-semibold text-slate-800 mb-2">
        สัญลักษณ์ระดับน้ำท่วม
      </div>
      <ul className="space-y-1.5">
        <li className="flex items-center gap-2 text-xs">
          <span className="inline-block w-6 h-1.5 rounded-full" style={{ background: '#CA8A04' }} />
          <span className="text-slate-700">🟡 สัญจรลำบาก / เฝ้าระวัง</span>
        </li>
        <li className="flex items-center gap-2 text-xs">
          <span className="inline-block w-6 h-1.5 rounded-full" style={{ background: '#DC2626' }} />
          <span className="text-slate-700">🔴 สัญจรไม่ได้ / วิกฤต</span>
        </li>
        <li className="flex items-center gap-2 text-xs">
          <span className="inline-block px-1.5 py-0.5 rounded bg-red-100 border border-red-300 text-red-700 text-[10px] font-bold">
            🚨
          </span>
          <span className="text-slate-700">อพยพหนีน้ำ (≥80 ซม.)</span>
        </li>
        <li className="flex items-center gap-2 text-xs">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} />
          <span className="text-slate-700">📍 หมุดที่ผู้ใช้แจ้ง (สีตามระดับน้ำ)</span>
        </li>
      </ul>
      <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        💡 ระดับความรุนแรงคำนวณจากระดับน้ำ (cm) โดยตรง
      </div>
    </div>
  )
}