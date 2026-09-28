import { CloudRain, RefreshCw, Megaphone, Phone, User, LogIn, LogOut } from 'lucide-react'

export default function Header({
  lastUpdated, loading, onRefresh, onResetView, onOpenSOS, onOpenIncident,
  onOpenContacts, currentUser, onLoginClick, onLogoutClick, onGoogleSignIn,
  googleLoading,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1500px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sm sm:shadow-md sm:shadow-sky-200">
            <CloudRain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              rainthai
            </h1>
            <p className="text-[11px] md:text-xs text-slate-500">
              ติดตามสถานการณ์ฝน & น้ำท่วมในประเทศไทย
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {lastUpdated && (
            <div className="hidden lg:block text-xs text-slate-500" title="ข้อมูลดึงจาก Open-Meteo / OSM · รีเฟรชอัตโนมัติทุก 15 นาที">
              อัปเดตล่าสุด: :{' '}
              <span className="font-medium text-slate-700">
                {new Date(lastUpdated).toLocaleTimeString('th-TH')}
              </span>
              <span className="ml-1 text-[10px] text-slate-400">⏱️ auto · 15 นาที</span>
            </div>
          )}
          {onResetView && (
            <button
              onClick={onResetView}
              className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-sky-600 border border-slate-200 hover:border-sky-300 px-2.5 py-1.5 rounded-lg transition"
            >
              🎯 กลับสู่ กทม.
            </button>
          )}

          {/* ===== User / Login ===== */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              {/* Avatar + name */}
              <div className="hidden sm:inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs font-medium pl-1.5 pr-3 py-1.5 rounded-lg shadow-sm max-w-[200px]">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-6 h-6 rounded-full flex-shrink-0 object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {(currentUser.displayName || currentUser.username || 'U').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="truncate">{currentUser.displayName || currentUser.username}</span>
              </div>
              <button
                onClick={onLogoutClick}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-300 px-2 py-1.5 rounded-lg transition"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ออก</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn || onLoginClick}
              disabled={googleLoading}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold px-3 py-2 rounded-lg shadow-sm transition disabled:opacity-50"
              title="เข้าสู่ระบบด้วย Google"
            >
              {googleLoading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.715v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.613z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.182l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 009 18z" />
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.103-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.346l2.582-2.582C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                </svg>
              )}
              <span className="hidden sm:inline">เข้าสู่ระบบ</span>
            </button>
          )}

          {/* 📞 คลังเบอร์ */}
          <button
            onClick={onOpenContacts}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-3 py-2 rounded-lg shadow-sm transition"
            title="คลังเบอร์ติดต่อฉุกเฉิน"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">📞 คลังเบอร์</span>
          </button>

          {/* 📢 แจ้งเหตุ */}
          <button
            onClick={onOpenIncident}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-3 py-2 rounded-lg shadow-sm transition"
            title="แจ้งเหตุน้ำท่วม / จุดเฝ้าระวัง / ถนนน้ำท่วม"
          >
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">📢 แจ้งเหตุ</span>
          </button>

          {/* 🚨 SOS */}
          <button
            onClick={onOpenSOS}
            className="relative inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-3 py-2 rounded-lg shadow-md shadow-red-200 transition"
            title="กดขอความช่วยเหลือ SOS"
          >
            <span className="relative">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.5C8 8 5 11.5 5 15a7 7 0 0 0 14 0c0-3.5-3-7-7-12.5z" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 inline-block w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse" />
            </span>
            <span className="hidden sm:inline">SOS</span>
            <span className="absolute -top-1 -right-1 inline-block w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-2 rounded-lg shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
        </div>
      </div>
    </header>
  )
}