import { useState } from 'react'
import { X, User, LogIn, UserPlus } from 'lucide-react'
import { login, registerUser, seedDefaultUsers } from '../services/auth'
import { useAuth } from '../AuthContext'

export default function LoginModal({ onClose, onLoggedIn }) {
  // เรียก seed ครั้งแรกให้ผู้ใช้เห็นว่ามี demo/guest ให้ลอง
  seedDefaultUsers()
  const { signInGoogle, loading: authLoading } = useAuth()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogle = async () => {
    try {
      setError(null)
      setGoogleLoading(true)
      await signInGoogle()
      // เมื่อ google OAuth redirect สำเร็จ จะกลับมาที่นี่ + onAuthChange อัปเดต user แล้ว
      // ในส่วนนี้จะไม่เห็น effect เพราะ redirect ออกจากแอปก่อน
    } catch (e) {
      setError(e?.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้')
      setGoogleLoading(false)
    }
  }

  const submit = () => {
    try {
      setError(null)
      let u
      if (mode === 'login') {
        u = login(username)
      } else {
        u = registerUser({ username, displayName, phone })
        u = login(u.username)
      }
      onLoggedIn && onLoggedIn(u)
      onClose()
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาด')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-blue-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {mode === 'login' ? '🔐 เข้าสู่ระบบ' : '🆕 สมัครสมาชิก'}
              </h2>
              <div className="text-xs text-slate-500">
                {mode === 'login'
                  ? 'จำเป็นสำหรับใช้งาน SOS / แจ้งเหตุ'
                  : 'สร้างบัญชีเพื่อใช้งาน SOS และแจ้งเหตุ'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {/* ===== Google Sign-In Button ===== */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || authLoading}
            className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {googleLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
                </svg>
                กำลังเปิด Google…
              </>
            ) : (
              <>
                {/* Google "G" logo */}
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.715v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.613z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.182l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 009 18z" />
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.103-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.346l2.582-2.582C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                </svg>
                เข้าสู่ระบบด้วย Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 my-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span>หรือ</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* ===== Local username form ===== */}
          <label className="block">
            <div className="text-[11px] font-semibold text-slate-600 mb-1">ชื่อผู้ใช้ (Username)</div>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="เช่น demo, guest, somchai"
              className="form-input"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </label>

          {mode === 'register' && (
            <>
              <label className="block">
                <div className="text-[11px] font-semibold text-slate-600 mb-1">ชื่อ-นามสกุล</div>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="form-input"
                />
              </label>
              <label className="block">
                <div className="text-[11px] font-semibold text-slate-600 mb-1">เบอร์โทร</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081-xxx-xxxx"
                  className="form-input"
                />
              </label>
            </>
          )}

          {error && (
            <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-2 py-1.5">
              ⚠️ {error}
            </div>
          )}

          {/* Hint accounts */}
          <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-[11px] text-slate-600">
            💡 <b>ทดสอบง่ายๆ</b> — ลอง username: <code className="bg-white px-1 rounded">demo</code> หรือ <code className="bg-white px-1 rounded">guest</code>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex flex-col gap-2">
          <button
            onClick={submit}
            className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
          >
            {mode === 'login' ? (
              <><LogIn className="w-4 h-4" /> เข้าสู่ระบบ</>
            ) : (
              <><UserPlus className="w-4 h-4" /> สมัครสมาชิก</>
            )}
          </button>
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
            className="w-full text-xs text-slate-500 hover:text-slate-700 py-1.5"
          >
            {mode === 'login' ? '✨ ยังไม่มีบัญชี? สมัครสมาชิก' : '↩ กลับไปเข้าสู่ระบบ'}
          </button>
        </div>

        <style>{`
          .form-input {
            width: 100%;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #E2E8F0;
            background: white;
            font-size: 14px;
            color: #0F172A;
            outline: none;
            transition: border 0.15s, box-shadow 0.15s;
          }
          .form-input:focus {
            border-color: #2563EB;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
          }
        `}</style>
      </div>
    </div>
  )
}