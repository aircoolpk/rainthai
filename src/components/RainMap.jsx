import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import { LEVEL_META } from '../services/weatherService'
import { SEVERITY_META } from '../data/provinces'
import { RISK_META } from '../data/bangkok'
import { severityFromWaterLevel } from '../data/bangkok'
import { ThumbsUp, ThumbsDown, Lock, MapPin, Clock } from 'lucide-react'

// ====== Custom rain drop icon ======
function buildRainIcon(level) {
  const color = LEVEL_META[level]?.color || '#10B981'
  return L.divIcon({
    className: 'rain-icon-wrapper',
    html: `<div class="rain-marker ${level}" style="width:40px;height:40px;">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 2.5C8 8 5 11.5 5 15a7 7 0 0 0 14 0c0-3.5-3-7-7-12.5z"/></svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -18],
  })
}

// ====== Custom flood icon (คลื่น) ======
function buildFloodIcon(severity) {
  return L.divIcon({
    className: 'flood-icon-wrapper',
    html: `<div class="flood-marker ${severity}">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>
        <path d="M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>
        <path d="M2 22c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>
      </svg>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  })
}

// ====== Incident icon (user-reported, สีคำนวณจาก waterLevelCm) ======
function buildIncidentIcon(waterLevelCm) {
  const meta = severityFromWaterLevel(waterLevelCm)
  return L.divIcon({
    className: 'incident-icon-wrapper',
    html: `<div class="incident-pin" style="background:${meta.color}">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M12 2.5C8 8 5 11.5 5 15a7 7 0 0 0 14 0c0-3.5-3-7-7-12.5z"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  })
}

// ====== Polyline style (yellow caution / red critical/watch) ======
function roadStyle(severity) {
  const cfg = {
    critical: { color: '#DC2626', animate: true,  weight: 9, opacity: 0.95 },
    watch:    { color: '#DC2626', animate: true,  weight: 8, opacity: 0.90 },
    caution:  { color: '#CA8A04', animate: false, weight: 7, opacity: 0.90 },
  }[severity] || { color: '#999', weight: 4, opacity: 0.7 }
  return { ...cfg, className: cfg.animate ? 'flood-road-animated' : '' }
}

function zoneStyle(severity) {
  const cfg = {
    critical: { color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.32, weight: 2 },
    watch:    { color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.28, weight: 2 },
    caution:  { color: '#CA8A04', fillColor: '#CA8A04', fillOpacity: 0.28, weight: 2 },
  }[severity] || { color: '#999', fillColor: '#999', fillOpacity: 0.20, weight: 1 }
  return cfg
}

function MapController({ focus }) {
  const map = useMap()
  useEffect(() => {
    if (focus && Array.isArray(focus) && focus.length === 2) {
      map.flyTo(focus, 13, { duration: 0.8 })
    } else {
      map.flyTo([13.7563, 100.5018], 11, { duration: 0.8 })
    }
  }, [focus, map])
  return null
}

// ====== Incident Popup (read-only) ======
function IncidentPopup({ inc, onVote }) {
  const meta = severityFromWaterLevel(inc.waterLevelCm)
  return (
    <div className="min-w-[240px]">
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-sm text-slate-900">{inc.road}</div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
          style={{ background: meta.color }}
        >
          {meta.severity === 'critical' ? 'อพยพ' :
           meta.severity === 'danger'   ? 'วิกฤต' :
           meta.severity === 'watch'    ? 'สัญจรลำบาก' :
           meta.severity === 'caution'  ? 'เฝ้าระวัง' : 'ปกติ'}
        </span>
      </div>
      <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
        <MapPin className="w-3 h-3" /> {inc.amphure}{inc.tambon ? ` · ${inc.tambon}` : ''}
      </div>
      <div className="text-xs text-slate-700 mt-1">
        ระดับน้ำ: <b style={{ color: meta.color }}>{inc.waterLevelCm} ซม.</b>
      </div>
      {inc.note && <div className="text-xs text-slate-500 mt-1">{inc.note}</div>}
      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
        {inc.anonymous ? (
          <><Lock className="w-3 h-3" /> ไม่ระบุตัวตน</>
        ) : inc.reporter ? (
          <>โดย {inc.reporter}</>
        ) : null}
        <span>·</span>
        <Clock className="w-3 h-3" /> {new Date(inc.submittedAt).toLocaleString('th-TH')}
      </div>
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
        <button
          onClick={() => onVote(inc.id, 'up')}
          className={`text-[11px] px-2 py-1 rounded-md border transition flex items-center gap-1 font-medium ${
            inc.userVoted === 'up'
              ? 'bg-emerald-500 border-emerald-600 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <ThumbsUp className="w-3 h-3" /> {inc.votes?.up || 0}
        </button>
        <button
          onClick={() => onVote(inc.id, 'down')}
          className={`text-[11px] px-2 py-1 rounded-md border transition flex items-center gap-1 font-medium ${
            inc.userVoted === 'down'
              ? 'bg-rose-500 border-rose-600 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <ThumbsDown className="w-3 h-3" /> {inc.votes?.down || 0}
        </button>
      </div>
    </div>
  )
}

export default function RainMap({
  provinces = [],
  floods = [],
  view = 'combined',
  onProvinceClick,
  onFloodClick,
  focus,
  selectedProvinceId,
  bkkDistricts = [],
  floodRoads = [],
  floodZones = [],
  incidents = [],
  onIncidentClick,
  onIncidentVote,
  onDistrictClick,
}) {
  const showRain  = view === 'rain'     || view === 'combined'
  const showFlood = view === 'flood'    || view === 'combined'

  return (
    <MapContainer
      center={[13.7563, 100.5018]}
      zoom={11}
      scrollWheelZoom
      className="z-0"
    >
      <MapController focus={focus} />

      {/* OpenStreetMap — ฟรี 100% ไม่ต้องใช้ API Key */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {/* ===== Polylines: เส้นถนนน้ำท่วม ===== */}
      {showFlood && floodRoads.map((r) => {
        const isEvacuate = r.waterLevelCm >= 80
        return (
          <Polyline
            key={r.id}
            positions={r.coordinates}
            pathOptions={roadStyle(r.severity)}
          >
            <Tooltip
              direction="top"
              offset={[0, -8]}
              opacity={1}
              permanent
              className="flood-road-tooltip"
            >
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-900">{r.name}</div>
                <div className="text-[10px] mt-0.5" style={{ color: roadStyle(r.severity).color }}>
                  สูง {r.waterLevelCm} ซม.
                </div>
                {isEvacuate && (
                  <div className="text-[10px] mt-0.5 font-bold text-red-700 bg-red-100 px-1 rounded">
                    🚨 อพยพหนีน้ำ
                  </div>
                )}
              </div>
            </Tooltip>
            <Popup>
              <div className="min-w-[220px]">
                <div className="font-semibold text-slate-900">{r.name}</div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                    style={{ background: SEVERITY_META[r.severity].color }}
                  >
                    {SEVERITY_META[r.severity].label}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700">
                    สูง {r.waterLevelCm} ซม.
                  </span>
                </div>
                {isEvacuate && (
                  <div className="mt-2 px-2 py-1.5 bg-red-100 border border-red-300 rounded text-[11px] font-bold text-red-700">
                    🚨 อพยพหนีน้ำ — ระดับน้ำเกินเอว สัญจรไม่ได้
                  </div>
                )}
                <div className="text-xs text-slate-700 mt-2">{r.note}</div>
              </div>
            </Popup>
          </Polyline>
        )
      })}

      {/* ===== Polygons: โซนน้ำท่วม ===== */}
      {showFlood && floodZones.map((z) => {
        const isEvacuate = (z.waterLevelCm || 100) >= 80
        return (
          <Polygon
            key={z.id}
            positions={z.coordinates}
            pathOptions={zoneStyle(z.severity)}
          >
            <Tooltip
              direction="center"
              offset={[0, 0]}
              opacity={1}
              permanent
              className="flood-zone-tooltip"
            >
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-900">{z.name}</div>
                {z.waterLevelCm && (
                  <div className="text-[10px] mt-0.5" style={{ color: zoneStyle(z.severity).color }}>
                    สูง {z.waterLevelCm} ซม.
                  </div>
                )}
                {isEvacuate && (
                  <div className="text-[10px] mt-0.5 font-bold text-red-700">🚨 อพยพ</div>
                )}
              </div>
            </Tooltip>
            <Popup>
              <div className="min-w-[200px]">
                <div className="text-sm font-semibold text-slate-900">{z.name}</div>
                {z.waterLevelCm && (
                  <div className="text-xs text-slate-700 mt-1">
                    ระดับน้ำ: <b>{z.waterLevelCm} ซม.</b>
                  </div>
                )}
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white mt-1"
                  style={{ background: SEVERITY_META[z.severity].color }}>
                  {SEVERITY_META[z.severity].label}
                </span>
                {isEvacuate && (
                  <div className="mt-2 px-2 py-1.5 bg-red-100 border border-red-300 rounded text-[11px] font-bold text-red-700">
                    🚨 อพยพหนีน้ำ — ระดับน้ำเกินเอว
                  </div>
                )}
              </div>
            </Popup>
          </Polygon>
        )
      })}

      {/* ===== Markers: จังหวัดอื่น ===== */}
      {showRain && provinces.map((p) => {
        if (p.error) return null
        return (
          <Marker
            key={p.id}
            position={[p.lat, p.lon]}
            icon={buildRainIcon(p.level)}
            eventHandlers={{ click: () => onProvinceClick && onProvinceClick(p) }}
            zIndexOffset={selectedProvinceId === p.id ? 1000 : 0}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-semibold text-slate-900">{p.name}</div>
                <div className="text-xs text-slate-500">{p.region}</div>
                <div className="text-xs mt-1">
                  ฝน 24 ชม.: <b>{p.accumulated24h} มม.</b>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* ===== Markers: เขตกทม. ===== */}
      {showRain && bkkDistricts.map((d) => (
        <Marker
          key={d.id}
          position={[d.lat, d.lon]}
          icon={buildRainIcon(d.risk)}
          eventHandlers={{ click: () => onDistrictClick && onDistrictClick(d) }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="font-semibold text-slate-900">{d.name}</div>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                  style={{ background: RISK_META[d.risk].color }}
                >
                  {RISK_META[d.risk].label}
                </span>
              </div>
              <div className="text-xs text-slate-700">
                ฝน 24 ชม.: <b>{d.rain24h} มม.</b>
              </div>
              {d.communities?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">
                    ชุมชนที่ท่วมขัง ({d.communities.length})
                  </div>
                  <ul className="text-xs text-slate-700 list-disc pl-4 space-y-0.5">
                    {d.communities.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* ===== Markers: Flood points ===== */}
      {showFlood && floods.map((f) => (
        <Marker
          key={f.id}
          position={[f.lat, f.lon]}
          icon={buildFloodIcon(f.severity)}
          eventHandlers={{ click: () => onFloodClick && onFloodClick(f) }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <div className="font-semibold text-slate-900">{f.name}</div>
              <div className="text-xs text-slate-700 mt-1">
                ระดับน้ำ: <b>{f.waterLevel}</b>
              </div>
              {f.note && <div className="text-xs text-slate-500 mt-1">{f.note}</div>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* ===== Markers: User-reported incidents (📍ปักหมุดอัตโนมัติ) ===== */}
      {incidents.map((inc) => (
        <Marker
          key={inc.id}
          position={[inc.lat, inc.lon]}
          icon={buildIncidentIcon(inc.waterLevelCm)}
          eventHandlers={{ click: () => onIncidentClick && onIncidentClick(inc) }}
          zIndexOffset={500}
        >
          <Popup>
            <IncidentPopup inc={inc} onVote={onIncidentVote} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}