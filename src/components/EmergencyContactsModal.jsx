import { X, Phone, Shield, Hospital, ArrowUpRight } from 'lucide-react'

// =========================================================
// คลังเบอร์ติดต่อฉุกเฉิน — แบ่ง 2 หมวดหมู่
// =========================================================

// หมวด 1: หน่วยงานฉุกเฉิน & กู้ภัยหลัก
const EMERGENCY_SERVICES = [
  { id: 'es-01', name: 'กรมป้องกันและบรรเทาสาธารณภัย (ปภ.)', phone: '1784', desc: 'ศูนย์รับแจ้งเหตุอุทกภัย วาตภัย ฯลฯ' },
  { id: 'es-02', name: 'ศูนย์นเรนทร / สพฉ. (กู้ชีพ/กู้ภัย)', phone: '1669', desc: 'สายด่วนการแพทย์ฉุกเฉิน' },
  { id: 'es-03', name: 'ดับเพลิงและกู้ภัย', phone: '199', desc: 'อัคคีภัย กู้ภัยทุกประเภท' },
  { id: 'es-04', name: 'JS100 (ตำรวจทางหลวง)', phone: '1137', desc: 'เหตุฉุกเฉินบนทางด่วน/ทางหลวง' },
  { id: 'es-05', name: 'สวพ.91 (สายด่วน กทม.)', phone: '1644', desc: 'ศูนย์บริการข้อมูล กทม.' },
  { id: 'es-06', name: 'กู้ชีพวชิระ (โรงพยาบาลวชิระ)', phone: '1554', desc: 'รถพยาบาลฉุกเฉิน' },
  { id: 'es-07', name: 'กู้ภัยสว่าง-ร่มเกล้า', phone: '02-329-3333', desc: 'ศูนย์กู้ภัยในพื้นที่กรุงเทพฯ' },
  { id: 'es-08', name: 'ตำรวจท่องเที่ยว', phone: '1155', desc: 'ช่วยเหลือนักท่องเที่ยวฉุกเฉิน' },
]

// หมวด 2: เบอร์ติดต่อฉุกเฉิน/ห้องฉุกเฉินโรงพยาบาลหลัก กทม.+ปริมณฑล
const HOSPITAL_ER = [
  { id: 'hp-01', name: 'โรงพยาบาลศิริราช',           phone: '02-419-7000', desc: 'ER: 02-419-7702 · ถนนพรานนก-บางกอกน้อย' },
  { id: 'hp-02', name: 'โรงพยาบาลจุฬาลงกรณ์',        phone: '02-256-4000', desc: 'ER: 02-256-4992 · เขตปทุมวัน' },
  { id: 'hp-03', name: 'โรงพยาบาลรามาธิบดี',        phone: '02-201-1000', desc: 'ER: 02-201-1881 · เขตราชเทวี' },
  { id: 'hp-04', name: 'โรงพยาบาลราชวิถี',          phone: '02-644-7000', desc: 'ER: 02-644-7682 · เขตราชเทวี' },
  { id: 'hp-05', name: 'โรงพยาบาลธรรมศาสตร์ (ศูนย์รังสิต)', phone: '02-926-9999', desc: 'ER: 02-926-9911 · อ.คลองหลวง ปทุมธานี' },
  { id: 'hp-06', name: 'โรงพยาบาลพระมงกุฎเกล้า',    phone: '02-763-9300', desc: 'ER: 02-763-9385 · เขตราชเทวี' },
  { id: 'hp-07', name: 'โรงพยาบาลวชิระ',             phone: '02-244-3000', desc: 'ER: 02-244-3247 · เขตดุสิต' },
  { id: 'hp-08', name: 'โรงพยาบาลเจริญกรุงประชารักษ์', phone: '02-291-0202', desc: 'ER: 02-291-0202 · เขตบางรัก' },
  { id: 'hp-09', name: 'โรงพยาบาลตำรวจ',             phone: '02-207-6000', desc: 'ER: 02-207-6632 · เขตปทุมวัน' },
  { id: 'hp-10', name: 'โรงพยาบาลภูมิพลอดุลยเดช',   phone: '02-572-7000', desc: 'ER: 02-572-7000 · เขตจตุจักร' },
  { id: 'hp-11', name: 'โรงพยาบาลสมุทรสาคร',         phone: '034-427-099', desc: 'ER: 034-427-099 · อ.เมือง สมุทรสาคร' },
  { id: 'hp-12', name: 'โรงพยาบาลสมุทรปราการ',       phone: '02-701-1800', desc: 'ER: 02-701-1800 · อ.เมือง สมุทรปราการ' },
  { id: 'hp-13', name: 'โรงพยาบาลนนทบุรี',           phone: '02-596-7888', desc: 'ER: 02-596-7888 · อ.เมือง นนทบุรี' },
  { id: 'hp-14', name: 'โรงพยาบาลบ้านแพ้ว (องค์การ)', phone: '034-484-444', desc: 'ER: 034-484-444 · อ.บ้านแพ้ว สมุทรสาคร' },
]

export default function EmergencyContactsModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full md:max-w-3xl bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-red-50 via-white to-rose-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                📞 คลังเบอร์ติดต่อฉุกเฉิน
              </h2>
              <div className="text-xs text-slate-500">
                กดเบอร์โทรได้ทันที · แบ่งเป็น {EMERGENCY_SERVICES.length + HOSPITAL_ER.length} เบอร์
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
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* ===== หมวด 1: หน่วยงานฉุกเฉิน ===== */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-600" />
              1. หน่วยงานฉุกเฉิน & กู้ภัยหลัก ({EMERGENCY_SERVICES.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {EMERGENCY_SERVICES.map((s) => (
                <ContactCard
                  key={s.id}
                  name={s.name}
                  phone={s.phone}
                  desc={s.desc}
                  accent="red"
                />
              ))}
            </div>
          </section>

          {/* ===== หมวด 2: โรงพยาบาล ===== */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Hospital className="w-4 h-4 text-sky-600" />
              2. เบอร์ติดต่อฉุกเฉิน/ห้องฉุกเฉินโรงพยาบาลหลัก ({HOSPITAL_ER.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {HOSPITAL_ER.map((s) => (
                <ContactCard
                  key={s.id}
                  name={s.name}
                  phone={s.phone}
                  desc={s.desc}
                  accent="sky"
                />
              ))}
            </div>
          </section>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-500">
          💡 กดเบอร์โทรเพื่อโทรออกทันทีผ่านแอปโทรศัพท์ (mobile) หรือโปรแกรมโทรศัพท์ (desktop)
        </div>
      </div>
    </div>
  )
}

function ContactCard({ name, phone, desc, accent }) {
  const palette = accent === 'red'
    ? { icon: 'bg-red-50 text-red-600', btn: 'bg-red-600 hover:bg-red-500' }
    : { icon: 'bg-sky-50 text-sky-600', btn: 'bg-sky-600 hover:bg-sky-500' }

  // ทำความสะอาดเบอร์ให้เหลือตัวเลข + เครื่องหมายบวกสำหรับ tel:
  const telHref = `tel:${phone.replace(/[^\d+]/g, '')}`

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5 hover:border-slate-200 hover:shadow-sm transition">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${palette.icon}`}>
        <Phone className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm text-slate-800 truncate">
          {name}
        </div>
        <div className="text-[11px] text-slate-500 truncate">{desc}</div>
      </div>
      <a
        href={telHref}
        className={`inline-flex items-center gap-1 ${palette.btn} text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-sm transition flex-shrink-0`}
      >
        {phone}
        <ArrowUpRight className="w-3 h-3" />
      </a>
    </div>
  )
}