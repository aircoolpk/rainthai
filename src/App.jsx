import { useEffect, useState, useCallback, useMemo } from 'react'

import { THAI_PROVINCES, FLOOD_REPORTS, SEVERITY_META } from './data/provinces'
import {
  BKK_DISTRICTS, FLOOD_ROADS, FLOOD_ZONES, PERIMETER_PROVINCES, RISK_META,
} from './data/bangkok'
import { parseWaterLevelCm } from './data/waterLevel'
import { fetchAllProvinces, LEVEL_META } from './services/weatherService'
import {
  seedSOSCases, activeSOS, expiredSOS,
  applyAutoExpire, loadSOSCases, saveSOSCases,
} from './services/communitySystem'
import {
  loadIncidents, seedIncidents, autoCleanIncidents, voteIncident,
} from './services/incidentSystem'
import {
  getAllDistrictsWeather, refreshAllDistrictsWeather,
  WEATHER_CACHE_TTL_MS,
} from './services/weatherCache'
import { useAuth } from './AuthContext.jsx'

import Header                  from './components/Header.jsx'
import RainMap                 from './components/RainMap.jsx'
import Legend                  from './components/Legend.jsx'
import SOSCaseCard             from './components/SOSCaseCard.jsx'
import UnifiedFloodReportCard  from './components/UnifiedFloodReportCard.jsx'
import SearchBar               from './components/SearchBar.jsx'
import LoadingOverlay          from './components/LoadingOverlay.jsx'
import DistrictPanel           from './components/DistrictPanel.jsx'
import SOSModal                from './components/SOSModal.jsx'
import IncidentReportModal     from './components/IncidentReportModal.jsx'
import LoginModal              from './components/LoginModal.jsx'
import EmergencyContactsModal  from './components/EmergencyContactsModal.jsx'
import Pagination              from './components/Pagination.jsx'
import {
  Droplets, Waves, Siren, MapPin, Building2, Megaphone, Phone, Car, Home,
  ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react'

const SOS_PAGE_SIZE = 9
const DISTRICT_PAGE_SIZE = 6

// risk priority สำหรับ sort: critical/danger ก่อน → watch → moderate → safe
const RISK_PRIORITY = { critical: 0, danger: 1, watch: 2, moderate: 3, safe: 4 }

// เรียงเขตตาม: วิกฤต > เฝ้าระวัง > ปกติ, แล้วตามชื่อเขต (ภาษาไทย)
function sortDistricts(list) {
  return [...list].sort((a, b) => {
    const pa = RISK_PRIORITY[a.risk] ?? 99
    const pb = RISK_PRIORITY[b.risk] ?? 99
    if (pa !== pb) return pa - pb
    return (a.name || '').localeCompare(b.name || '', 'th')
  })
}

export default function App() {
  const [provinces, setProvinces]     = useState([])
  const [loading, setLoading]         = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const [selectedProvince, setSelectedProvince] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [activeReportId, setActiveReportId]   = useState(null)
  const [activeSosId, setActiveSosId]         = useState(null)
  const [focus, setFocus]                   = useState(null)

  const [search, setSearch] = useState('')

  // Auth state — uses Supabase-backed context
  const { user: currentUser, loading: authLoading, signOut: authSignOut, signInGoogle } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginIntent, setLoginIntent] = useState(null) // 'sos' | 'incident' | null
  const [googleLoading, setGoogleLoading] = useState(false)

  // Pagination
  const [pageSos, setPageSos]       = useState(1)
  const [pageDistrict, setPageDistrict] = useState(1)

  // Modal state
  const [sosOpen, setSOpen]         = useState(false)
  const [incidentOpen, setIOpen]    = useState(false)
  const [contactsOpen, setCOpen]   = useState(false)

  // Data state
  const [sosCases, setSCases]       = useState(() => applyAutoExpire(seedSOSCases()))
  const [incidents, setIncidents]   = useState(() => {
    const list = seedIncidents()
    return Array.isArray(list) ? list : []
  })

  // Flood report filter tab
  const [reportFilter, setReportFilter] = useState('all') // 'all' | 'road' | 'housing'

  // ---------- load weather (5-minute cache for districts, fresh fetch for provinces) ----------
  const load = useCallback(async (opts = {}) => {
    setLoading(true)
    try {
      // ดึง provinces (Open-Meteo) — ต่างจังหวัด
      const provincesPromise = fetchAllProvinces(THAI_PROVINCES)
        .then((result) => {
          const safe = Array.isArray(result) ? result : []
          setProvinces(safe)
          return safe
        })
        .catch((e) => {
          console.warn('[load] provinces fetch failed:', e)
          return []
        })

      // ดึง districts (กทม. + ปริมณฑล) — ใช้ cache 5 นาที
      // opts.force = true เมื่อกดปุ่ม "อัปเดตข้อมูลสด"
      const districtsPromise = getAllDistrictsWeather({ force: !!opts.force })
        .then(({ data, timestamp }) => {
          const safe = Array.isArray(data) ? data : []
          // merge เข้า provinces (กทม + ปริมณฑล + ต่างจังหวัด)
          setProvinces((prev) => {
            const prevArr = Array.isArray(prev) ? prev : []
            // กัน duplicate id (ถ้ามี)
            const map = new Map()
            ;[...safe, ...prevArr].forEach((it) => { if (it && it.id) map.set(it.id, it) })
            return Array.from(map.values())
          })
          setLastUpdated(new Date(timestamp))
        })
        .catch((e) => {
          console.warn('[load] districts weather failed:', e)
        })

      await Promise.allSettled([provincesPromise, districtsPromise])
      // ถ้า cache timestamp ไม่ได้อัปเดต → set now
      setLastUpdated((cur) => cur || new Date().toISOString())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-tick + auto-refetch every 15 minutes:
  //   - tickSOS: re-evaluate 24h expiry on local SOS cases
  //   - tickIncidents: auto-clean expired incidents, refresh state
  //   - load(): refetch Open-Meteo weather data for all provinces
  useEffect(() => {
    const tickSOS      = () => {
      const next = applyAutoExpire(loadSOSCases())
      setSCases(Array.isArray(next) ? next : [])
    }
    const tickIncident = () => {
      const wByDist = BKK_DISTRICTS.reduce((acc, d) => {
        acc[d.id] = { rain24h: d.rain24h }
        return acc
      }, {})
      try {
        const result = autoCleanIncidents(loadIncidents(), wByDist)
        // autoCleanIncidents() คืน { filtered, removedIds }
        const safeList = Array.isArray(result?.filtered) ? result.filtered : []
        setIncidents(safeList)
      } catch (e) {
        console.warn('[tickIncident] failed:', e)
      }
    }
    const refetchWeather = () => {
      // ดึงข้อมูล Open-Meteo + สถานะ SOS/Incidents ใหม่ (cache 5 นาทีสำหรับ districts)
      tickIncident()
      tickSOS()
      load({ force: true })
    }

    // ทำงานครั้งแรกหลัง mount (auto-refresh ทุก 5 นาที — districts ใช้ cache)
    const FIVE_MIN = WEATHER_CACHE_TTL_MS // 5 * 60 * 1000
    const t = setInterval(refetchWeather, FIVE_MIN)

    // Tick status ทุก 60 วินาที (เพื่อ update "รอมาแล้ว X นาที" และ check expiry)
    const tickShort = setInterval(() => {
      tickSOS()
      tickIncident()
    }, 60 * 1000)

    return () => {
      clearInterval(t)
      clearInterval(tickShort)
    }
  }, [load])

  useEffect(() => {
    setPageSos(1)
  }, [sosCases.length])

  // Reset district pagination เมื่อ search เปลี่ยน
  useEffect(() => {
    setPageDistrict(1)
  }, [search])

  // ---------- district lookup for SOS ----------
  const districtLookup = useMemo(() => {
    const m = {}
    BKK_DISTRICTS.forEach((d) => { m[d.id] = d.name })
    PERIMETER_PROVINCES.forEach((p) => {
      p.amphure.forEach((a) => { m[a.id] = `${a.name} (${p.name})` })
    })
    return m
  }, [])

  // ---------- counts ----------
  const districtCounts = useMemo(() => {
    return BKK_DISTRICTS.reduce(
      (acc, d) => ((acc[d.risk] = (acc[d.risk] || 0) + 1), acc),
      { safe: 0, moderate: 0, watch: 0, danger: 0, critical: 0 },
    )
  }, [])

  const sosCounts = useMemo(() => ({
    active:   activeSOS(sosCases).length,
    expired:  expiredSOS(sosCases).length,
    total:    sosCases.length,
  }), [sosCases])

  // ---------- Unified flood reports ----------
  const allFloodReport = useMemo(() => {
    // Defensive: incidents ต้องเป็น Array เสมอ (กัน crash จากข้อมูลเก่าใน localStorage)
    const safeIncidents = Array.isArray(incidents) ? incidents : []
    const incidentItems = safeIncidents.map((i) => ({
      id: i.id,
      name: i.road,
      waterLevel: `${i.waterLevelCm} ซม.`,
      waterLevelCm: i.waterLevelCm,
      note: i.note,
      reportedAt: new Date(i.submittedAt).toLocaleString('th-TH'),
      lat: i.lat,
      lon: i.lon,
      source: 'user',
      sourceLabel: 'User Report',
      category: i.category || 'road',
      amphure: i.amphure,
      tambon: i.tambon,
      reporter: i.reporter,
      anonymous: i.anonymous,
      lastActivityAt: i.lastActivityAt,
      lastUpdatedAt: i.lastActivityAt || i.submittedAt,
      severity: i.severity,
      raw: i,
    }))
    const apiItems = FLOOD_REPORTS.map((f) => {
      // แปลง reportedAt (string '2026-09-28 08:30') → ISO เพื่อให้ sort ถูกต้อง
      // ใช้ Date ตีความ 'YYYY-MM-DD HH:mm' (Bangkok)
      let isoTime = f.reportedAt
      try {
        const m = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/.exec(f.reportedAt || '')
        if (m) {
          const [_, y, mo, d, h, mi] = m
          isoTime = new Date(+y, +mo - 1, +d, +h, +mi).toISOString()
        }
      } catch {}
      // สกัด cm จาก waterLevel field (string เช่น "สูงถึงระดับคอ (~150 ซม.)")
      const waterLevelCm = parseWaterLevelCm(f.waterLevel)
      return {
        ...f,
        waterLevelCm,
        // แสดง cm ใหม่เพื่อ UI
        waterLevelDisplay: waterLevelCm > 0 ? `${waterLevelCm} ซม.` : (f.waterLevel || '—'),
        source: 'api',
        sourceLabel: 'Open-Meteo/OSM',
        // map category: ถ้า name มี "ชุมชน" / "บ้าน" / "ที่อยู่อาศัย" / "อพยพ" → housing
        category: /ชุมชน|บ้าน|ที่อยู่อาศัย|ท่วมที่อยู่|หลังคา|อาคาร|อพยพ/i.test(f.name || '') ? 'housing' : 'road',
        severity: f.severity,
        // ใส่ทั้ง lastUpdatedAt + lastActivityAt ให้ตรงกัน → ใช้ sort field เดียวกัน
        lastUpdatedAt: isoTime,
        lastActivityAt: isoTime,
        raw: f,
      }
    })
    // Sort by lastUpdatedAt (descending — ใหม่สุดขึ้นก่อน) — single source of truth
    return [...incidentItems, ...apiItems].sort((a, b) => {
      const ta = new Date(a.lastUpdatedAt || 0).getTime()
      const tb = new Date(b.lastUpdatedAt || 0).getTime()
      return tb - ta
    })
  }, [incidents])

  // Filter by category tab
  const filteredReports = useMemo(() => {
    if (reportFilter === 'all') return allFloodReport
    return allFloodReport.filter((r) => r.category === reportFilter)
  }, [allFloodReport, reportFilter])

  // ---------- SOS ----------
  const safeSOSCases = Array.isArray(sosCases) ? sosCases : []
  const liveSOS = activeSOS(safeSOSCases)
  const sortedSOS = [...liveSOS] // ซ่อนเคสที่ช่วยแล้ว
  const sosTotalPages = Math.max(1, Math.ceil(sortedSOS.length / SOS_PAGE_SIZE))
  const sosPageItems  = sortedSOS.slice((pageSos - 1) * SOS_PAGE_SIZE, pageSos * SOS_PAGE_SIZE)

  // ---------- handlers ----------
  const handleLoginClick = (intent = null) => {
    setLoginIntent(intent)
    setLoginOpen(true)
  }
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true)
      await signInGoogle()
      // Supabase will redirect → on return onAuthChange updates `currentUser`
    } catch (e) {
      console.error('Google sign-in failed:', e)
      alert(`เข้าสู่ระบบด้วย Google ไม่สำเร็จ: ${e?.message || e}`)
    } finally {
      setGoogleLoading(false)
    }
  }
  const handleLoggedIn = (u) => {
    // (legacy local fallback — Supabase path updates via context)
    if (loginIntent === 'sos') {
      setTimeout(() => setSOpen(true), 100)
    } else if (loginIntent === 'incident') {
      setTimeout(() => setIOpen(true), 100)
    }
    setLoginIntent(null)
  }
  const handleLogout = async () => {
    await authSignOut()
  }

  const openSOSFromMap = () => {
    if (!currentUser) {
      handleLoginClick('sos')
      return
    }
    setSOpen(true)
  }
  const openIncidentFromMap = () => {
    if (!currentUser) {
      handleLoginClick('incident')
      return
    }
    setIOpen(true)
  }

  const handleProvinceClick = (p) => {
    setSelectedProvince(p); setSelectedDistrict(null); setActiveReportId(null); setActiveSosId(null)
    setFocus([p.lat, p.lon])
  }
  const handleDistrictClick = (d) => {
    setSelectedDistrict(d); setSelectedProvince(null); setActiveReportId(null); setActiveSosId(null)
    setFocus([d.lat, d.lon])
  }
  const handleReportClick = (r) => {
    setActiveReportId(r.id); setActiveSosId(null)
    setFocus([r.lat, r.lon])
  }
  const handleSosClick = (s) => {
    setActiveSosId(s.id); setActiveReportId(null)
    setFocus([s.lat, s.lon])
  }
  const handleIncidentVote = (id, type) => {
    voteIncident(id, type)
    setIncidents(loadIncidents())
  }

    // ---------- Manual refresh (Open-Meteo + Incidents) ----------
  const [refreshingReports, setRefreshingReports] = useState(false)
  const [lastRefreshAt, setLastRefreshAt] = useState(() => new Date())

  const handleRefreshReports = useCallback(async () => {
    if (refreshingReports) return
    setRefreshingReports(true)
    try {
      // ดึง incidents ใหม่ + weather data (Open-Meteo) พร้อมกัน
      const promises = [load()]
      const wByDist = BKK_DISTRICTS.reduce((acc, d) => {
        acc[d.id] = { rain24h: d.rain24h }
        return acc
      }, {})

      // autoCleanIncidents() คืน { filtered, removedIds } — เอาแค่ filtered (array)
      let cleanArray = []
      try {
        const result = autoCleanIncidents(loadIncidents(), wByDist)
        cleanArray = Array.isArray(result?.filtered) ? result.filtered : []
      } catch {
        cleanArray = []
      }
      setIncidents(cleanArray)

      // รอ Open-Meteo fetch เสร็จ (catch error แยก — ไม่ให้พังทั้งหน้า)
      // force = true เพื่อ bypass cache 5 นาที
      await load({ force: true })
      setLastRefreshAt(new Date())
    } catch (err) {
      console.error('[refreshReports] failed:', err)
      // ไม่ throw — UI ยังใช้งานได้
    } finally {
      // หน่วงเวลาเล็กน้อยเพื่อให้ UI เห็น animation
      setTimeout(() => setRefreshingReports(false), 350)
    }
  }, [refreshingReports, load])

  const handleSosResolve = (id) => {
    const next = sosCases.map((c) =>
      c.id === id ? { ...c, status: 'resolved', resolvedAt: new Date().toISOString() } : c,
    )
    saveSOSCases(next)
    setSCases(next)
  }

  const openContacts = () => setCOpen(true)

  const clearAllSelections = () => {
    setSelectedProvince(null); setSelectedDistrict(null)
    setActiveReportId(null); setActiveSosId(null)
    setFocus(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        lastUpdated={lastUpdated}
        loading={loading}
        onRefresh={load}
        onResetView={clearAllSelections}
        onOpenSOS={openSOSFromMap}
        onOpenIncident={openIncidentFromMap}
        onOpenContacts={openContacts}
        currentUser={currentUser}
        onLoginClick={() => handleLoginClick(null)}
        onLogoutClick={handleLogout}
        onGoogleSignIn={handleGoogleSignIn}
        googleLoading={googleLoading}
      />

      <main className="flex-1 max-w-[1500px] w-full mx-auto px-3 md:px-5 py-4 space-y-4">
        {/* ===== Hero / Focus Banner (แก้ไขตามข้อ 4) ===== */}
        <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-100 rounded-2xl px-5 py-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-sky-600 font-bold">
                📍 โฟกัสพื้นที่ กรุงเทพมหานคร และ ปริมณฑล
              </div>
              <div className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5">
                🚨 ระบบแจ้งเตือนน้ำท่วม และขอความช่วยเหลือ Realtime
              </div>
              <div className="text-xs md:text-sm text-slate-500 mt-1">
                แผนที่เรียลไทม์ · เส้นถนนน้ำท่วม · โซนชุมชนวิกฤต · ระบบ SOS อัตโนมัติ · ปริมณฑล 5 จังหวัด
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(RISK_META).map(([k, m]) =>
                districtCounts[k] ? (
                  <span
                    key={k}
                    className={`px-2.5 py-1 rounded-full ${m.bg} ${m.text} border ${m.border} font-medium text-xs`}
                  >
                    {m.label} {districtCounts[k]}
                  </span>
                ) : null,
              )}
              {sosCounts.active > 0 && (
                <button
                  onClick={openSOSFromMap}
                  className="px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-700 font-medium text-xs flex items-center gap-1.5 animate-pulse"
                >
                  <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full" />
                  🚨 SOS {sosCounts.active}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            icon={Building2}
            color="bg-sky-50 text-sky-600"
            label="เขตในกรุงเทพฯ"
            value={BKK_DISTRICTS.length}
            sub={`${districtCounts.danger + districtCounts.critical || 0} เขตเสี่ยงวิกฤต`}
          />
          <SummaryCard
            icon={Waves}
            color="bg-orange-50 text-orange-600"
            label="โซน/ถนนน้ำท่วม"
            value={FLOOD_ZONES.length + FLOOD_ROADS.length}
            sub={`${FLOOD_ZONES.length} โซน · ${FLOOD_ROADS.length} เส้นถนน`}
          />
          <SummaryCard
            icon={Siren}
            color="bg-red-50 text-red-600"
            label="เคส SOS กำลังรอ"
            value={sosCounts.active}
            sub={`${sosCounts.expired} หมดเวลาอัตโนมัติ`}
            onClick={openSOSFromMap}
          />
          <SummaryCard
            icon={Phone}
            color="bg-emerald-50 text-emerald-600"
            label="คลังเบอร์ติดต่อ"
            value="📞"
            sub="22 เบอร์ฉุกเฉิน"
            onClick={openContacts}
          />
        </div>

        {/* Map + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
          <div className="h-[480px] md:h-[600px] lg:h-[680px] rounded-xl overflow-hidden border border-slate-200 shadow-sm relative bg-white">
            <LoadingOverlay show={loading && provinces.length === 0} />
            <RainMap
              provinces={provinces}
              floods={FLOOD_REPORTS}
              view="combined"
              onProvinceClick={handleProvinceClick}
              onFloodClick={handleReportClick}
              focus={focus}
              selectedProvinceId={selectedProvince?.id}
              bkkDistricts={BKK_DISTRICTS}
              floodRoads={FLOOD_ROADS}
              floodZones={FLOOD_ZONES}
              incidents={incidents}
              onIncidentClick={handleReportClick}
              onIncidentVote={handleIncidentVote}
              onDistrictClick={handleDistrictClick}
            />
          </div>

          <div className="flex flex-col gap-3 lg:h-[680px]">
            {selectedDistrict ? (
              <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <DistrictPanel
                  district={selectedDistrict}
                  onClose={() => { setSelectedDistrict(null); setFocus(null) }}
                  onFocus={(coord) => setFocus(coord)}
                />
              </div>
            ) : selectedProvince ? (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="text-xs text-sky-600 uppercase tracking-wider font-bold">
                  {selectedProvince.region}
                </div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedProvince.name}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ฝน 24 ชม.: <b>{selectedProvince.accumulated24h} มม.</b>
                </div>
                <button
                  onClick={() => { setSelectedProvince(null); setFocus(null) }}
                  className="mt-3 text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  ← กลับ
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="🔍 ค้นหาเขต / ชุมชน / ถนน..."
                  />
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
                  {/* Header + Pagination status */}
                  {(() => {
                    const filtered = BKK_DISTRICTS.filter((d) =>
                      !search.trim() ||
                      d.name.toLowerCase().includes(search.toLowerCase()) ||
                      (d.communities || []).some((c) => c.toLowerCase().includes(search.toLowerCase())),
                    )
                    const sorted = sortDistricts(filtered)
                    const totalPages = Math.max(1, Math.ceil(sorted.length / DISTRICT_PAGE_SIZE))
                    const safePage = Math.min(pageDistrict, totalPages)
                    const pageItems = sorted.slice((safePage - 1) * DISTRICT_PAGE_SIZE, safePage * DISTRICT_PAGE_SIZE)
                    return (
                      <>
                        <div className="flex items-center justify-between px-1">
                          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            เขตในกรุงเทพฯ ({sorted.length})
                          </div>
                          {sorted.length > 0 && (
                            <div className="text-[10px] text-slate-500 font-medium">
                                หน้า {safePage} / {totalPages}
                              </div>
                          )}
                        </div>
                        {pageItems.map((d) => (
                          <DistrictCard
                            key={d.id}
                            d={d}
                            onClick={handleDistrictClick}
                            isActive={selectedDistrict?.id === d.id}
                          />
                        ))}
                        {sorted.length === 0 && (
                          <div className="text-center text-xs text-slate-400 py-4">
                            ไม่พบเขตที่ค้นหา
                          </div>
                        )}

                        {/* ===== Pagination controls (เขต กทม.) ===== */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 pt-2 pb-1">
                            <button
                              onClick={() => setPageDistrict((p) => Math.max(1, p - 1))}
                              disabled={safePage <= 1}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              <span>ก่อนหน้า</span>
                            </button>
                            <div className="text-xs text-slate-600 font-medium px-2">
                              {safePage} / {totalPages}
                            </div>
                            <button
                              onClick={() => setPageDistrict((p) => Math.min(totalPages, p + 1))}
                              disabled={safePage >= totalPages}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              <span>ถัดไป</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>

                <Legend />
              </>
            )}
          </div>
        </div>

        {/* ===== Consolidated Flood Reports (with Filter Tabs) ===== */}
        <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Waves className="w-4 h-4 text-orange-500" />
                รายงานจุดน้ำท่วม
                <span className="text-xs font-normal text-slate-500">
                  ({filteredReports.length} รายการ)
                </span>
              </h2>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  User Reports
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-sky-500" />
                  Open-Meteo & OSM
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  อัปเดตล่าสุด: <b className="text-slate-700">{lastRefreshAt.toLocaleTimeString('th-TH')}</b>
                  <span className="text-[10px] text-slate-400">⏱️ auto 5 นาที (cache) · force = manual</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshReports}
                disabled={refreshingReports}
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-3.5 py-2 rounded-lg shadow-sm transition"
                title="ดึงข้อมูลสดจาก Open-Meteo / OSM / Supabase"
              >
                <RefreshCw className={`w-4 h-4 ${refreshingReports ? 'animate-spin' : ''}`} />
                <span>{refreshingReports ? 'กำลังอัปเดต...' : 'อัปเดตข้อมูลสด'}</span>
              </button>
              <button
                onClick={openIncidentFromMap}
                className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"
              >
                <Megaphone className="w-4 h-4" />
                📢 แจ้งเหตุ
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mb-4 w-full md:w-fit">
            {[
              { id: 'all',     label: 'ทั้งหมด',          count: allFloodReport.length },
              { id: 'road',    label: '🛣️ น้ำท่วมถนน',   count: allFloodReport.filter(r => r.category === 'road').length },
              { id: 'housing', label: '🏠 ที่อยู่อาศัย',    count: allFloodReport.filter(r => r.category === 'housing').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReportFilter(tab.id)}
                className={`flex-1 md:flex-none px-3 py-1.5 text-xs rounded-md transition font-medium ${
                  reportFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label} <span className="opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {(!Array.isArray(filteredReports) || filteredReports.length === 0) ? (
              <div className="col-span-full text-center text-sm text-slate-400 py-6">
                {reportFilter === 'all'
                  ? 'ยังไม่มีรายงาน — กดปุ่ม "📢 แจ้งเหตุ" เพื่อเพิ่มข้อมูล'
                  : `ไม่มีรายงานในหมวด${reportFilter === 'road' ? 'น้ำท่วมถนน' : 'ที่อยู่อาศัย'}`}
              </div>
            ) : filteredReports.slice(0, 30).map((r) => (
              <UnifiedFloodReportCard
                key={r.id}
                report={r}
                onClick={handleReportClick}
                isActive={activeReportId === r.id}
                currentUser={currentUser}
              />
            ))}
          </div>
        </section>

        {/* ===== SOS Emergency Section (ซ่อนเคสที่ช่วยแล้วจากหน้าแรก) ===== */}
        <section className="bg-gradient-to-br from-red-50 via-white to-orange-50 border-2 border-red-100 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Siren className="w-5 h-5 text-red-600" />
                🚨 เคสฉุกเฉิน SOS (กำลังรอ)
                <span className="text-xs font-normal text-slate-500">
                  ({liveSOS.length} เคส)
                </span>
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                {sosCounts.active} กำลังรอ · กดปุ่มนำทางเพื่อเปิด Google Maps · ปุ่ม ✅ ลบเคส เฉพาะเจ้าของเคส
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSOpen(true)}
                className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"
              >
                <Siren className="w-4 h-4" />
                🚨 กดขอความช่วยเหลือ
              </button>
              <button
                onClick={() => setSOpen(true)}
                className="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-sm font-semibold px-3 py-2 rounded-lg shadow-sm flex items-center gap-2"
              >
                📜 ดูเคสที่ได้รับการช่วยเหลือแล้ว
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(!Array.isArray(sosPageItems) || sosPageItems.length === 0) ? (
              <div className="col-span-full text-center py-8 px-4 bg-gradient-to-br from-emerald-50 to-sky-50 rounded-xl border border-emerald-200">
                <div className="text-4xl mb-3">✅</div>
                <div className="text-base font-bold text-emerald-700 mb-2">
                  ยังไม่มีรายการขอความช่วยเหลือฉุกเฉินในขณะนี้
                </div>
                <div className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  หากต้องการความช่วยเหลือด่วน สามารถกดปุ่ม
                  <span className="font-bold text-red-600"> "🚨 กดขอความช่วยเหลือ"</span> ได้ทันที
                  และกรุณาเข้ามาอัปเดตสถานะหากได้รับการช่วยเหลือเรียบร้อยแล้ว
                </div>
              </div>
            ) : sosPageItems.map((c) => (
              <SOSCaseCard
                key={c.id}
                c={c}
                onResolve={handleSosResolve}
                onClick={handleSosClick}
                districts={districtLookup}
                currentUser={currentUser}
                showResolve
              />
            ))}
          </div>

          <div className="mt-4">
            <Pagination
              page={pageSos}
              totalPages={sosTotalPages}
              onPageChange={setPageSos}
              totalItems={liveSOS.length}
              label="เคส"
            />
          </div>
        </section>

        {/* ===== Footer (Single-Line · Responsive) ===== */}
        <footer className="mt-8 border-t border-slate-200 bg-white/60 backdrop-blur">
          <div className="max-w-[1500px] mx-auto px-4 md:px-6 py-4">
            <div className="flex flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs md:text-sm text-slate-600">
              <span>
                Dev by <span className="font-semibold text-sky-700">Peerawit K.</span>
              </span>
              <span className="text-slate-300 select-none">·</span>
              <span className="font-medium text-slate-700">rainthai</span>
              <span className="text-slate-300 select-none">·</span>
              <span>React + Vite + Leaflet</span>
              <span className="text-slate-300 select-none">·</span>
              <span>tile จาก</span>
              <a
                className="text-sky-600 hover:text-sky-700 hover:underline font-medium"
                href="https://www.openstreetmap.org/"
                target="_blank"
                rel="noreferrer"
              >
                OpenStreetMap
              </a>
              <span className="text-slate-300 select-none">·</span>
              <span>ข้อมูลจาก</span>
              <a
                className="text-sky-600 hover:text-sky-700 hover:underline font-medium"
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
              >
                Open-Meteo
              </a>
            </div>
          </div>
        </footer>
      </main>

      {sosOpen && (
        <SOSModal
          onClose={() => setSOpen(false)}
          onJumpToFlood={(s) => { setSOpen(false); setFocus([s.lat, s.lon]) }}
          onOpenVote={(intent) => {
            setSOpen(false)
            handleLoginClick(intent === 'login-required' ? 'sos' : null)
          }}
          currentUser={currentUser}
        />
      )}

      {incidentOpen && currentUser && (
        <IncidentReportModal
          onClose={() => setIOpen(false)}
          onSubmitted={() => setIncidents(loadIncidents())}
          currentUser={currentUser}
        />
      )}

      {contactsOpen && (
        <EmergencyContactsModal onClose={() => setCOpen(false)} />
      )}

      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onLoggedIn={handleLoggedIn}
        />
      )}
    </div>
  )
}

function SummaryCard({ icon: Icon, color, label, value, sub, onClick }) {
  const Wrap = onClick ? 'button' : 'div'
  return (
    <Wrap
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm card-hover text-left ${
        onClick ? 'cursor-pointer hover:border-emerald-300 w-full' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Wrap>
  )
}

function DistrictCard({ d, onClick, isActive }) {
  const meta = RISK_META[d.risk]
  return (
    <button
      onClick={() => onClick && onClick(d)}
      className={`w-full text-left rounded-lg border bg-white p-3 card-hover ${
        isActive ? `${meta.border} ring-1` : 'border-slate-100'
      }`}
      style={isActive ? { boxShadow: `0 0 0 2px ${meta.color}33` } : {}}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium text-sm text-slate-800 truncate">
          {d.name}
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${meta.text} ${meta.bg} border ${meta.border} flex-shrink-0`}
        >
          {meta.label}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
        <span>ฝน 24 ชม.: <b className="text-slate-700">{d.rain24h} มม.</b></span>
        {d.communities?.length > 0 && (
          <span className="flex items-center gap-1 text-red-600 font-medium">
            ⚠️ {d.communities.length} ชุมชน
          </span>
        )}
      </div>
    </button>
  )
}