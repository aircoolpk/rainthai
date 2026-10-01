import { useEffect, useRef, useState } from 'react'
import { AlertCircle, RefreshCw, Camera, Wifi, WifiOff, Loader2, ImageOff } from 'lucide-react'
import {
  CCTV_PROXY_CONFIG,
  buildSnapshotUrlCandidates,
  getNextSnapshotTier,
} from '../data/cctv'

/**
 * CCTVPlayer v3 — Snapshot-only mode (รองรับ fallback หลายชั้น)
 *
 * โหมดใหม่:
 *   - เลิกใช้ HLS.js (มักล้มเหลวจาก CORS/stream issues)
 *   - ใช้ <img src="..."> พร้อม auto-refresh ทุก 5-10 วินาที
 *   - Fallback chain หลายชั้น (3-4 tier) จนกว่าจะเจอภาพ:
 *       1. proxy snapshot via world.tehx.dyndns.info
 *       2. direct snapshot จาก BMA/DOH
 *       3. placeholder fallback
 *       4. No Signal empty state
 *
 * props:
 *  - camera: { id, name, source, category, type, url, lat, lon, snapshotFallbacks? }
 *  - onClose?: () => void
 *  - height?: string
 *  - showCredit?: boolean
 */
export default function CCTVPlayer({ camera, onClose, height = 'h-64', showCredit = true }) {
  const [status, setStatus] = useState('loading')   // loading | live | error
  const [errorMsg, setErrorMsg] = useState('')
  const [snapshotKey, setSnapshotKey] = useState(0)
  const [tierIndex, setTierIndex] = useState(0)     // index ใน candidates
  const [triedTiers, setTriedTiers] = useState([])
  const [reloadNonce, setReloadNonce] = useState(0)
  const [tierHistory, setTierHistory] = useState([]) // log การพยายาม
  const imgRef = useRef(null)
  const snapshotTimerRef = useRef(null)
  const failedTiersRef = useRef(new Set())

  // ===== Resolve URL candidates =====
  const candidates = buildSnapshotUrlCandidates(camera)
  const currentTier = candidates[tierIndex] || candidates[candidates.length - 1]
  const activeUrl = currentTier?.url
  const activeSource = currentTier?.source

  // ===== Snapshot mode effect =====
  useEffect(() => {
    if (!camera) return
    setStatus('loading')
    setErrorMsg('')
    setSnapshotKey(0)
    setTierIndex(0)
    setTriedTiers([])
    failedTiersRef.current = new Set()
    setTierHistory([])

    // refresh interval ตาม source
    const intervalMs = currentTier?.refreshMs || CCTV_PROXY_CONFIG.refreshIntervalFastMs
    const tick = () => setSnapshotKey((k) => k + 1)
    snapshotTimerRef.current = setInterval(tick, intervalMs)

    return () => {
      if (snapshotTimerRef.current) {
        clearInterval(snapshotTimerRef.current)
        snapshotTimerRef.current = null
      }
    }
  }, [camera?.id, reloadNonce])

  // Update timer เมื่อ tier เปลี่ยน
  useEffect(() => {
    if (!snapshotTimerRef.current) return
    const intervalMs = currentTier?.refreshMs || CCTV_PROXY_CONFIG.refreshIntervalFastMs
    clearInterval(snapshotTimerRef.current)
    const tick = () => setSnapshotKey((k) => k + 1)
    snapshotTimerRef.current = setInterval(tick, intervalMs)
    return () => {
      if (snapshotTimerRef.current) clearInterval(snapshotTimerRef.current)
    }
  }, [tierIndex])

  if (!camera) return null

  // ===== Handlers =====
  const handleImgError = () => {
    if (!camera) return
    failedTiersRef.current.add(tierIndex)
    setTriedTiers((prev) => Array.from(new Set([...prev, tierIndex])))

    // ลอง tier ถัดไป
    const nextIdx = getNextSnapshotTier(candidates, tierIndex, failedTiersRef.current)
    setTierHistory((h) => [...h, { from: tierIndex, to: nextIdx, ts: Date.now() }])
    if (nextIdx !== tierIndex && nextIdx < candidates.length) {
      setTierIndex(nextIdx)
      setStatus('loading')
      setErrorMsg(`Tier ${tierIndex + 1} failed → ลอง tier ${nextIdx + 1}`)
      setSnapshotKey((k) => k + 1)
    } else {
      setStatus('error')
      setErrorMsg(`ไม่สามารถโหลดภาพได้ — ลอง ${candidates.length} tier แล้ว`)
    }
  }

  const handleImgLoad = (e) => {
    // ตรวจ placeholder image (ภาพเทา/ดำ = proxy คืน placeholder)
    const img = e.target
    if (!img || !img.naturalWidth) {
      handleImgError()
      return
    }
    // ถ้าภาพเล็กมาก (< 50px) อาจเป็น 1x1 placeholder
    if (img.naturalWidth < 50 || img.naturalHeight < 50) {
      // ดูว่า tier ปัจจุบันมี backup candidates เหลือไหม
      if (tierIndex < candidates.length - 1) {
        handleImgError()
        return
      }
    }
    setStatus('live')
    setErrorMsg('')
  }

  const handleRetry = () => {
    setStatus('loading')
    setErrorMsg('')
    setTierIndex(0)
    setTriedTiers([])
    failedTiersRef.current = new Set()
    setTierHistory([])
    setSnapshotKey((k) => k + 1)
    setReloadNonce((n) => n + 1)
  }

  const handleSkipToNext = () => {
    const nextIdx = Math.min(tierIndex + 1, candidates.length - 1)
    setTierIndex(nextIdx)
    setStatus('loading')
    setSnapshotKey((k) => k + 1)
  }

  const handleSkipToPrev = () => {
    const prevIdx = Math.max(tierIndex - 1, 0)
    setTierIndex(prevIdx)
    setStatus('loading')
    setSnapshotKey((k) => k + 1)
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
                <span className="text-emerald-400">· via proxy</span>
              )}
              {activeSource === 'direct' && (
                <span className="text-amber-400">· direct</span>
              )}
              <span className="text-slate-500">· tier {tierIndex + 1}/{candidates.length}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusBadge status={status} source={activeSource} />
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
            <div className="text-xs text-slate-400">
              {activeSource === 'proxy' ? 'กำลังเชื่อมต่อ proxy...' :
               activeSource === 'direct' ? 'กำลังโหลดภาพตรง...' :
               'กำลังโหลด...'}
            </div>
            <div className="text-[9px] text-slate-500 mt-1">tier {tierIndex + 1}/{candidates.length}</div>
          </div>
        )}

        {/* Snapshot Image */}
        <img
          ref={imgRef}
          key={`${camera.id}-${tierIndex}-${snapshotKey}-${reloadNonce}`}
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
              ไม่สามารถโหลดภาพจากกล้องนี้ได้
            </div>
            <div className="text-[10px] text-slate-600 mb-1">
              {candidates.length} tier ที่ลองแล้ว
            </div>
            {errorMsg && (
              <div className="text-[10px] text-slate-600 mb-3 px-4 text-center max-w">
              {errorMsg}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap justify-center px-4">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 border border-cyan-700 hover:border-cyan-500 px-3 py-1.5 rounded-md transition"
              >
                <RefreshCw className="w-3 h-3" />
                ลองใหม่ทั้งหมด
              </button>
            { tierIndex > 0 && (
              <button
                onClick={handleSkipToPrev}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-md transition"
              >
                ← tier ก่อนหน้า
              </button>
            ) }
            { tierIndex < candidates.length - 1 && (
              <button
                onClick={handleSkipToNext}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-md transition"
              >
                tier ถัดไป →
              </button>
            ) }
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
          <span>{activeSource === 'proxy' ? 'PROXY' : activeSource === 'direct' ? 'DIRECT' : activeSource}</span>
          <span className="text-slate-500">·{currentTier?.refreshMs / 1000}s</span>
        </div>

        {/* Tier navigation bottom-left */}
        {candidates.length > 1 && status !== 'error' && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 z-10">
            <button
              onClick={handleSkipToPrev}
              disabled={tierIndex === 0}
              className="w-5 h-5 flex items-center justify-center text-slate-300 bg-slate-900/80 hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed text-[10px]"
              aria-label="tier ก่อนหน้า"
            >
              ‹
            </button>
            <span className="text-[9px] font-mono text-slate-300 bg-slate-900/80 px-1.5 py-0.5 rounded">
              {tierIndex + 1}/{candidates.length}
            </span>
            <button
              onClick={handleSkipToNext}
              disabled={tierIndex >= candidates.length - 1}
              className="w-5 h-5 flex items-center justify-center text-slate-300 bg-slate-900/80 hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed text-[10px]"
              aria-label="tier ถัดไป"
            >
              ›
            </button>
          </div>
        )}
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

function StatusBadge({ status, source }) {
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