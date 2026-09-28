import { useMemo, useState } from 'react'
import { X, ChevronRight, MapPin, Droplets, Thermometer, Building2, TreePine } from 'lucide-react'
import {
  deriveAmphureMock,
  deriveTambonMock,
  LEVEL_META,
  weatherCodeLabel,
} from '../services/weatherService'

export default function DrillDownPanel({ province, onClose, onFocus }) {
  const [selectedAmphure, setSelectedAmphure] = useState(null)

  const amphureData = useMemo(() => {
    if (!province || province.error) return []
    return deriveAmphureMock(province)
  }, [province])

  const tambonData = useMemo(() => {
    if (!selectedAmphure) return []
    return deriveTambonMock(selectedAmphure)
  }, [selectedAmphure])

  if (!province) return null

  return (
    <aside className="bg-white border-l border-slate-200 w-full md:w-[380px] flex flex-col h-full animate-slide-up">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-b from-sky-50 to-white">
        <div className="min-w-0">
          <div className="text-[11px] text-sky-600 font-semibold uppercase tracking-wider">
            {province.region}
          </div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            {province.name}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              ฝนสะสม:{' '}
              <span className="font-semibold text-slate-800">
                {province.accumulated24h} มม.
              </span>
            </span>
            {province.temperature !== null && (
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-slate-800">
                  {Math.round(province.temperature)}°C
                </span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            สภาพอากาศ: {weatherCodeLabel(province.weatherCode)}
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

      {/* Breadcrumb */}
      <div className="px-5 py-2 border-b border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 bg-white">
        <Building2 className="w-3.5 h-3.5" />
        <span className="font-medium text-slate-700">{province.name}</span>
        {selectedAmphure && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="font-medium text-slate-700">{selectedAmphure.name}</span>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {!selectedAmphure && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-500" />
                เขต/อำเภอ ({amphureData.length})
              </h3>
            </div>
            <div className="space-y-2">
              {amphureData.map((a) => {
                const meta = LEVEL_META[a.level]
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      setSelectedAmphure(a)
                      onFocus && onFocus([a.lat, a.lon])
                    }}
                    className="w-full text-left rounded-lg border border-slate-100 bg-white p-3 card-hover"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm text-slate-800 truncate">
                        {a.name}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${meta.text} ${meta.bg} border ${meta.border}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-sky-500" />
                        {a.accumulated24h} มม.
                      </span>
                      {a.temperature !== null && (
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-amber-500" />
                          {Math.round(a.temperature)}°C
                        </span>
                      )}
                      <span className="flex items-center gap-1 ml-auto text-slate-400">
                        <TreePine className="w-3 h-3" />
                        {a.tambons.length} ตำบล
                      </span>
                    </div>
                  </button>
                )
              })}
              {amphureData.length === 0 && (
                <div className="text-xs text-slate-400 py-4 text-center">
                  ไม่มีข้อมูลอำเภอ
                </div>
              )}
            </div>
          </section>
        )}

        {selectedAmphure && (
          <section>
            <button
              onClick={() => setSelectedAmphure(null)}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium mb-3 flex items-center gap-1"
            >
              ← กลับไปที่เขต/อำเภอ
            </button>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
              <TreePine className="w-4 h-4 text-slate-500" />
              ตำบล ({tambonData.length})
            </h3>
            <div className="space-y-1.5">
              {tambonData.map((t) => {
                const meta = LEVEL_META[t.level]
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-slate-700 truncate">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Droplets className="w-3 h-3" />
                        {t.accumulated24h} มม.
                      </div>
                    </div>
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0`}
                      style={{ background: meta.color }}
                      title={meta.label}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </aside>
  )
}