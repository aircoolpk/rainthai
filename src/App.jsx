import { useEffect, useState, useCallback, useMemo } from 'react'

import { THAI_PROVINCES, FLOOD_REPORTS, SEVERITY_META } from './data/provinces'
import {
  BKK_DISTRICTS, FLOOD_ROADS, FLOOD_ZONES, PERIMETER_PROVINCES, RISK_META,
} from './data/bangkok'
import { fetchAllProvinces, LEVEL_META } from './services/weatherService'
import {
  seedSOSCases, activeSOS, expiredSOS,
  applyAutoExpire, loadSOSCases, saveSOSCases,
} from './services/communitySystem'
import {
  loadIncidents, seedIncidents, autoCleanIncidents, voteIncident,
} from './services/incidentSystem'
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
} from 'lucide-react'

const SOS_PAGE_SIZE = 9

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

  // Modal state
  const [sosOpen, setSOpen]         = useState(false)
  const [incidentOpen, setIOpen]    = useState(false)
  const [contactsOpen, setCOpen]   = useState(false)

  // Data state
  const [sosCases, setSCases]       = useState(() => applyAutoExpire(seedSOSCases()))
  const [incidents, setIncidents]   = useState(() => seedIncidents())

  // Flood report filter tab
  const [reportFilter, setReportFilter] = useState('all') // 'all' | 'road' | 'housing'

  // ---------- load weather ----------
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchAllProvinces(THAI_PROVINCES)
      setProvinces(result)
      setLastUpdated(new Date().toISOString())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-tick SOS + auto-clean incidents every 60s
  useEffect(() => {
    const tick = () => {
      setSCases(applyAutoExpire(loadSOSCases()))
      const wByDist = BKK_DISTRICTS.reduce((acc, d) => {
        acc[d.id] = { rain24h: d.rain24h }
        return acc
      }, {})
      const { filtered } = autoCleanIncidents(loadIncidents(), wByDist)
      setIncidents(filtered)
    }
    const t = setInterval(tick, 60 * 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setPageSos(1)
  }, [sosCases.length])

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
    const incidentItems = incidents.map((i) => ({
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
      severity: i.severity,
      raw: i,
    }))
    const apiItems = FLOOD_REPORTS.map((f) => ({
      ...f,
      waterLevelCm: parseFloat(f.waterLevel) || 0,
      source: 'api',
      sourceLabel: 'Open-Meteo/OSM',
      // map category: ถ้า name มี "ชุมชน" หรือ "บ้าน" หรือ "ที่อยู่อาศัย" => housing
      category: /ชุมชน|บ้าน|ที่อยู่อาศัย|ท่วมที่อยู่|หลังคา|อาคาร|อพยพ/i.test(f.name || '') ? 'housing' : 'road',
      severity: f.severity,
      raw: f,
    }))
    return [...incidentItems, ...apiItems].sort((a, b) => {
      const ta = new Date(a.lastActivityAt || a.reportedAt).getTime()
      const tb = new Date(b.lastActivityAt || b.reportedAt).getTime()
      return tb - ta
    })
  }, [incidents])

  // Filter by category tab
  const filteredReports = useMemo(() => {
    if (reportFilter === 'all') return allFloodReport
    return allFloodReport.filter((r) => r.category === reportFilter)
  }, [allFloodReport, reportFilter])

  // ---------- SOS ----------
  const liveSOS = activeSOS(sosCases)
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
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-1">
                    เขตในกรุงเทพฯ (50)
                  </div>
                  {BKK_DISTRICTS.filter((d) =>
                    !search.trim() ||
                    d.name.toLowerCase().includes(search.toLowerCase()) ||
                    (d.communities || []).some(((c) => c.toLowerCase().includes(search.toLowerCase()))),
                  ).map((d) => (
                    <DistrictCard
                      key={d.id}
                      d={d}
                      onClick={handleDistrictClick}
                      isActive={selectedDistrict?.id === d.id}
                    />
                  ))}
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
              </div>
            </div>
            <button
              onClick={openIncidentFromMap}
              className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" />
              📢 แจ้งเหตุ
            </button>
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
            {filteredReports.length === 0 ? (
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
            {sosPageItems.length === 0 ? (
              <div className="col-span-full text-center text-sm text-emerald-600 py-6 bg-white/60 rounded-lg">
                ✅ ขณะนี้ไม่มีเคส SOS ค้าง — ทุกคนปลอดภัย
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