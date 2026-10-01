import { useEffect, useRef, useState } from 'react'
import { AlertCircle, RefreshCw, Camera, Wifi, WifiOff, Loader2, ImageOff, ExternalLink } from 'lucide-react'
import {
  CCTV_PROXY_CONFIG,
  buildSnapshotUrlCandidates,
} from '../data/cctv'

/**
 * CCTVPlayer v4 — Proxy-only mode (บังคับ 100%)
 *
 * การเปลี่ยนครั้งสำคัญ:
 *   - ลบ fallback chain ไป direct URL (cctb.bangkok.go.th, highwaytraffic.go.th) ทิ้ง
 *   - สาเหตุ: direct URL ติด CORS ทันที — โหลดภาพไม่ได้
 *   - ตอนนี้ใช้ Proxy (world.tehx.dyndns.info) 100% ไม่ว่าสถานะ Proxy จะเป็นอย่างไร
 *   - ถ้า Proxy fail → แสดง SVG placeholder (ไม่ลอง tier อื่นอีก)
 *   - มีปุ่ม "เปิด Proxy ด้วย tab ใหม่" ให้ user ตรวจสอบ proxy ได้เอง
 *
 * props:
 *  - camera: { id, name, source, category, type, url, lat, lon }
 *  - onClose?: () => void
 *  - height?: string
 *  - showCredit?: boolean
 */
export default function CCTVPlayer({ camera, onClose, height = 'h-64', showCredit = true }) {
  const [status, setStatus] = useState('loading')   // loading | live | error
  const [errorMsg, setErrorMsg] = useState('')
  const [snapshotKey, setSnapshotKey] = useState(0)
  const [reloadNonce, setReloadNonce] = useState(0)
  const imgRef = useRef(null)
  const snapshotTimerRef = useRef(null)

  // ===== Resolve URL — Proxy-only =====
  const candidates = buildSnapshotUrlCandidates(camera)
  const currentTier = candidates[0]   // บังคับ tier 0 เสมอ (Proxy)
  const activeUrl = currentTier?.url
  const activeSource = currentTier?.source

  // ===== Snapshot mode effect (Proxy only) =====
  useEffect(() => {
    if (!camera) return
    setStatus('loading')
    setErrorMsg('')
    setSnapshotKey(0)

    const refreshMs = currentTier?.refreshMs || CCTV_PROXY_CONFIG.refreshIntervalSlowMs
    const tick = () => setSnapshotKey((k) => k + 1)
    snapshotTimerRef.current = setInterval(tick, refreshMs)

    return () => {
      if (snapshotTimerRef.current) {
        clearInterval(snapshotTimerRef.current)
        snapshotTimerRef.current = null
      }
    }
  }, [camera?.id, reloadNonce])

  // Update timer เมื่อ reload
  useEffect(() => {
    if (!snapshotTimerRef.current) return
    const intervalMs = currentTier?.refreshMs || CCTV_PROXY_CONFIG.refreshIntervalSlowMs
    clearInterval(snapshotTimerRef.current)
    const tick = () => setSnapshotKey((k) => k + 1)
    snapshotTimerRef.current = setInterval(tick, intervalMs)
    return () => {
      if (snapshotTimerRef.current) clearInterval(snapshotTimerRef.current)
    }
  }, [snapshotKey, reloadNonce])

  if (!camera) return null

  // ===== Handlers =====
  const handleImgError = () => {
    // Proxy fail → แสดง placeholder (tier ถัดไป)
    // บังคับให้ใช้ Proxy 100% — ไม่ลอง direct URL
    setStatus('error')
    setErrorMsg(
      `Proxy ไม่ตอบสนอง (${CCTV_PROXY_CONFIG.proxyBase})\n` +
      `ตรวจสอบว่า proxy server online และ camera ID ถูกต้อง`,
    )
    setSnapshotKey((k) => k + 1)   // trigger โหลด placeholder
  }

  const handleImgLoad = (e) => {
    const img = e.target
    if (!img || !img.naturalWidth) {
      handleImgError()
      return
    }
    setStatus('live')
    setErrorMsg('')
  }

  const handleRetry = () => {
    setStatus('loading')
    setErrorMsg('')
    setSnapshotKey((k) => k + 1)
    setReloadNonce((n) => n + 1)
  }

  const handleOpenProxy = () => {
    // เปิด Proxy URL ด้วย tab ใหม่ เพื่อ user ตรวจสอบเอง
    window.open(activeUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-inner ${height} flex flex-col`}>
      {/* === Header === */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Camera className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-white text-xs font-semibold truncate">{camera.name}</div>
            <div className="text-slate-400 text-[10px] truncate flex items-center gap-1">
              <span>{camera.source}</span>
              {activeSource === 'proxy' && (
                <span className="text-emerald-400">· Proxy 100%</span>
              )}
              <span className="text-slate-500">· {camera.nameEn || ''}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusBadge status={status} />
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white w-6 h-6 flex items-center justify-center rounded transition"
              aria-label="ปิด"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* === Player Container === */}
      <div className="relative flex-1 bg-black overflow-hidden">
        {/* Loading overlay */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
            <div className="text-xs text-slate-400">กำลังโหลดผ่าน Proxy...</div>
            <div className="text-[9px] text-slate-500 mt-1 truncate max-w-[90%]">{activeUrl}</div>
          </div>
        )}

        {/* Snapshot Image (Proxy-only) */}
        <img
          ref={imgRef}
          key={`${camera?.id}-${snapshotKey}-${reloadNonce}`}
          src={activeUrl}
          alt={camera.name}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-contain bg-black transition-opacity duration-300 ${
            status === 'error' ? 'opacity-30' : 'opacity-100'
          }`}
          onLoad={handleImgLoad}
          onError={handleImgError}
        />

        {/* No Signal overlay */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-20 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-3">
              <ImageOff className="w-8 h-8 text-slate-500" />
            </div>
            <div className="text-base font-bold text-slate-300 mb-1">📵 No Signal</div>
            <div className="text-xs text-slate-500 mb-1">
              Proxy ไม่ส่งภาพกลับมา
            </div>
            <div className="text-[9px] text-slate-600 mb-1 px-4 text-center max-w-xs font-mono break-all">
              {CCTV_PROXY_CONFIG.proxyBase}
            </div>
            {errorMsg && (
              <div className="text-[10px] text-slate-600 mb-3 px-4 text-center max-w-xs whitespace-pre-line">
                {errorMsg}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap justify-center px-4">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 border border-cyan-700 hover:border-cyan-500 px-3 py-1.5 rounded-md transition"
              >
                <RefreshCw className="w-3 h-3" />
                ลองใหม่
              </button>
              <button
                onClick={handleOpenProxy}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-md transition"
                title="เปิดดู Proxy URL ด้วย tab ใหม่เพื่อตรวจสอบ"
              >
                <ExternalLink className="w-3 h-3" />
                เปิด Proxy
              </button>
            </div>
          </div>
        )}

        {/* Live indicator overlay */}
        {status === 'live' && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md z-10 shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            LIVE
          </div>
        )}

        {/* Source badge bottom-right */}
        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-300 bg-slate-900/80 px-1.5 py-0.5 rounded z-10 flex items-center gap-1">
          <span className="text-emerald-400">PROXY</span>
          <span className="text-slate-500">·{currentTier?.refreshMs / 1000}s</span>
        </div>
      </div>

      {/* === Footer: Description + Source Credit === */}
      {(camera.description || showCredit) && (
        <div className="px-3 py-1.5 bg-slate-800 border-t border-slate-700 space-y-0.5">
          {camera.description && (
            <div className="text-[10px] text-slate-400 truncate">📍 {camera.description}</div>
          )}
          {showCredit && (
            <div className="text-[9px] text-slate-500 truncate flex items-center gap-1">
              <span>🙏</span>
              <span className="truncate">{CCTV_PROXY_CONFIG.sourceCredit.th}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded">
        <Wifi className="w-2.5 h-2.5" />
        LIVE
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-rose-600/20 text-rose-300 border border-rose-700 px-1.5 py-0.5 rounded">
        <AlertCircle className="w-2.5 h-2.5" />
        ERR
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-slate-600/30 text-slate-300 border border-slate-600 px-1.5 py-0.5 rounded">
      <Loader2 className="w-2.5 h-2.5 animate-spin" />
      LOAD
    </span>
  )
}