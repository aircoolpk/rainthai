import { useEffect, useRef, useState } from 'react'
import { AlertCircle, RefreshCw, Camera, Wifi, WifiOff, Loader2 } from 'lucide-react'

/**
 * CCTVPlayer — รองรับ 3 mode:
 *  - 'hls'       → HLS.js เล่น .m3u8 (lazy load)
 *  - 'snapshot'  → <img> refresh ทุก 5 วินาที (พร้อม cache-buster)
 *  - 'youtube'   → <iframe> YouTube Live embed
 *
 * state ภายใน:
 *  - 'loading'  กำลังโหลด
 *  - 'live'     สัญญาณปกติ
 *  - 'error'    No Signal — แสดง empty state + retry
 *
 * props:
 *  - camera: { id, name, source, category, type, url, lat, lon }
 *  - onClose?: () => void   (ปุ่มปิด)
 *  - height?: string        (เช่น 'h-64', 'h-80')
 */
export default function CCTVPlayer({ camera, onClose, height = 'h-64' }) {
  const [status, setStatus] = useState('loading') // loading | live | error
  const [errorMsg, setErrorMsg] = useState('')
  const [snapshotKey, setSnapshotKey] = useState(0) // force reload
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const snapshotTimerRef = useRef(null)

  // ===== HLS =====
  useEffect(() => {
    if (!camera) return
    if (camera.type !== 'hls') return

    setStatus('loading')
    setErrorMsg('')
    const video = videoRef.current
    if (!video) return

    // ตรวจว่า browser รองรับ HLS โดยตรงหรือไม่ (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = camera.url
      video.addEventListener('loadedmetadata', () => setStatus('live'))
      video.addEventListener('error', () => {
        setStatus('error')
        setErrorMsg('ไม่สามารถเชื่อมต่อกล้องได้')
      })
      return () => {
        video.removeEventListener('loadedmetadata', () => {})
        video.removeEventListener('error', () => {})
        video.src = ''
      }
    }

    // ถ้าไม่ใช่ Safari → load Hls.js dynamically (Vite code-split friendly)
    let cancelled = false
    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        })
        hlsRef.current = hls
        hls.loadSource(camera.url)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus('live')
          video.play().catch(() => {/* autoplay blocked — ปล่อยให้ user กด play */})
        })
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setStatus('error')
            setErrorMsg(`HLS Error: ${data.type || 'unknown'}`)
            // พยายาม recover ก่อนยอมแพ้
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError()
                break
              default:
                break
            }
          }
        })
      } else {
        setStatus('error')
        setErrorMsg('Browser ไม่รองรับ HLS playback')
      }
    }).catch((e) => {
      setStatus('error')
      setErrorMsg(`โหลด Hls.js ไม่สำเร็จ: ${e?.message || e}`)
    })

    return () => {
      cancelled = true
      if (hlsRef.current) {
        try { hlsRef.current.destroy() } catch {}
        hlsRef.current = null
      }
    }
  }, [camera?.id, camera?.url, camera?.type])

  // ===== Snapshot mode =====
  useEffect(() => {
    if (!camera || camera.type !== 'snapshot') return
    setStatus('loading')
    setErrorMsg('')
    setSnapshotKey(0)

    const tick = () => setSnapshotKey((k) => k + 1)
    snapshotTimerRef.current = setInterval(tick, 5000)

    return () => {
      if (snapshotTimerRef.current) {
        clearInterval(snapshotTimerRef.current)
        snapshotTimerRef.current = null
      }
    }
  }, [camera?.id, camera?.type])

  // ===== YouTube =====
  // (จะ handle ผ่าน iframe ใน JSX)

  if (!camera) return null

  const handleRetry = () => {
    setStatus('loading')
    setErrorMsg('')
    setSnapshotKey((k) => k + 1)
    // HLS effect จะ re-trigger ถ้า camera เปลี่ยน — แต่ถ้า retry ต้อง rebuild
    if (camera.type === 'hls' && hlsRef.current) {
      try { hlsRef.current.destroy() } catch {}
      hlsRef.current = null
    }
    // บังคับให้ effect ทำงานใหม่ด้วยการ reload camera reference
    // (วิธีง่าย: ส่ง event ผ่าน key ของ player container)
    setReloadNonce((n) => n + 1)
  }

  const [reloadNonce, setReloadNonce] = useState(0)

  return (
    <div className={`bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-inner ${height} flex flex-col`}>
      {/* === Header === */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Camera className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-white text-xs font-semibold truncate">{camera.name}</div>
            <div className="text-slate-400 text-[10px] truncate">
              {camera.source} · {camera.nameEn || ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusBadge status={status} type={camera.type} />
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
      <div className="relative flex-1 bg-black overflow-hidden" key={`${camera.id}-${reloadNonce}`}>
        {/* Loading overlay */}
        {status === 'loading' && camera.type !== 'snapshot' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
            <div className="text-xs text-slate-400">กำลังเชื่อมต่อกล้อง...</div>
          </div>
        )}

        {/* HLS Player */}
        {camera.type === 'hls' && (
          <video
            ref={videoRef}
            controls
            muted
            playsInline
            autoPlay
            className={`w-full h-full object-contain bg-black ${status === 'live' ? '' : 'opacity-30'}`}
          />
        )}

        {/* Snapshot Player (img with cache-buster) */}
        {camera.type === 'snapshot' && (
          <img
            key={snapshotKey}
            src={`${camera.url}${camera.url.includes('?') ? '&' : '?'}t=${Date.now()}-${snapshotKey}`}
            alt={camera.name}
            className={`w-full h-full object-contain bg-black transition-opacity duration-300 ${
              status === 'error' ? 'opacity-30' : 'opacity-100'
            }`}
            onLoad={() => setStatus('live')}
            onError={() => {
              setStatus('error')
              setErrorMsg('ไม่สามารถโหลดภาพจากกล้องได้')
            }}
          />
        )}

        {/* YouTube */}
        {camera.type === 'youtube' && (
          <iframe
            src={camera.url}
            title={camera.name}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="w-full h-full"
          />
        )}

        {/* No Signal overlay */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-20 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-3">
              <WifiOff className="w-8 h-8 text-slate-500" />
            </div>
            <div className="text-base font-bold text-slate-300 mb-1">📵 No Signal</div>
            <div className="text-xs text-slate-500 mb-1">ไม่มีสัญญาณจากกล้องนี้</div>
            {errorMsg && (
              <div className="text-[10px] text-slate-600 mb-3 px-4 text-center max-w-xs">
                {errorMsg}
              </div>
            )}
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 border border-cyan-700 hover:border-cyan-500 px-3 py-1.5 rounded-md transition"
            >
              <RefreshCw className="w-3 h-3" />
              ลองใหม่
            </button>
          </div>
        )}

        {/* Live indicator overlay */}
        {status === 'live' && camera.type !== 'youtube' && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md z-10 shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            LIVE
          </div>
        )}

        {/* Type badge bottom-right */}
        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-300 bg-slate-900/80 px-1.5 py-0.5 rounded z-10">
          {camera.type === 'hls' ? 'HLS' : camera.type === 'snapshot' ? 'IMG·5s' : camera.type.toUpperCase()}
        </div>
      </div>

      {/* === Footer === */}
      {camera.description && (
        <div className="px-3 py-1.5 bg-slate-800 border-t border-slate-700">
          <div className="text-[10px] text-slate-400 truncate">📍 {camera.description}</div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, type }) {
  if (type === 'youtube') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-red-600/20 text-red-300 border border-red-700 px-1.5 py-0.5 rounded">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        YT
      </span>
    )
  }
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