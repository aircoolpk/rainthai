import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onPageChange, totalItems, label = 'รายการ' }) {
  if (totalPages <= 1) {
    return (
      <div className="text-[11px] text-slate-500 text-center py-2">
        แสดงทั้งหมด {totalItems} {label}
      </div>
    )
  }

  // สร้าง array ของ page numbers ที่จะแสดง (สูงสุด 5 ปุ่ม)
  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div className="text-[11px] text-slate-500">
        หน้า <b className="text-slate-700">{page}</b> / {totalPages} · ทั้งหมด {totalItems} {label}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ก่อนหน้า</span>
        </button>

        {visiblePages.map((p, idx) =>
          p === '…' ? (
            <span
              key={`dots-${idx}`}
              className="text-slate-400 text-xs px-1.5 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] text-xs px-2.5 py-1.5 rounded-md border transition ${
                page === p
                  ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <span className="hidden sm:inline">ถัดไป</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function getVisiblePages(current, total) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages = []
  // แสดง current ± 2 และหัว-ท้าย
  pages.push(1)
  if (current > 3) pages.push('…')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i += 1) pages.push(i)
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}