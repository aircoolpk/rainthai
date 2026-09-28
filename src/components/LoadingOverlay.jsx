import { Loader2 } from 'lucide-react'

export default function LoadingOverlay({ show, label = 'กำลังโหลดข้อมูลสภาพอากาศ…' }) {
  if (!show) return null
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
      <div className="flex items-center gap-2 text-slate-700 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
        {label}
      </div>
    </div>
  )
}