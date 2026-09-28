import { CloudRain, RefreshCw, Megaphone, Phone, User, LogIn, LogOut } from 'lucide-react'

export default function Header({
  lastUpdated, loading, onRefresh, onResetView, onOpenSOS, onOpenIncident,
  onOpenContacts, currentUser, onLoginClick, onLogoutClick,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1500px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-200">
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
            <div className="hidden lg:block text-xs text-slate-500">
              อัปเดตล่าสุด:{' '}
              <span className="font-medium text-slate-700">
                {new Date(lastUpdated).toLocaleTimeString('th-TH')}
              </span>
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

          {/* User / Login */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
                <User className="w-3.5 h-3.5" />
                {currentUser.displayName || currentUser.username}
              </span>
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
              onClick={onLoginClick}
              className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold px-3 py-2 rounded-lg shadow-sm transition"
              title="เข้าสู่ระบบ"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">🔐 เข้าสู่ระบบ</span>
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
                <path d="M12 2.5C8 8 5 11.5 5 15a7 7 0 0 0 14 0c0-3.5-3-7-7-12.5z"/>
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