# 🌧️ rainthai — Thailand Rain & Flood Tracker (v6 Consolidation)

Web app ติดตามสถานการณ์**ฝนและน้ำท่วม** ครอบคลุม **กรุงเทพฯ 50 เขต + ปริมณฑล 5 จังหวัด**
พร้อม **ระบบรายงานน้ำท่วมแบบไฮบริด** (User Reports + Open-Meteo/OSM), **SOS Case Management**,
**คลังเบอร์ติดต่อฉุกเฉิน 22 เบอร์**, **Incident Reporting พร้อม GPS**, และ Auto-Clean

## ✨ Features

### 📋 รายงานจุดน้ำท่วม (Consolidated & Pagination)
- **หมวดหมู่เดียว** รวมรายงานจาก 2 แหล่ง:
  - 🟢 **User Reports** — รายงานจากผู้ใช้ในพื้นที่จริง
  - 🔵 **Auto API** — ข้อมูลคาดการณ์/ตรวจวัดจาก Open-Meteo & OpenStreetMap
- แสดง **10 รายการต่อหน้า** + Pagination [ก่อนหน้า] [1 2 3...] [ถัดไป]

### 📢 Incident Reporting พร้อม GPS
- ปุ่ม **📢 แจ้งเหตุ** บน Header + ใน section
- ฟอร์มครบ: จังหวัด, เขต/อำเภอ, แขวง/ตำบล, ชื่อถนน/ชุมชน
- **📍 ปุ่มดึงพิกัดปัจจุบัน (GPS)** + ช่อง Lat/Lng (navigator.geolocation)
- 🔒 **ไม่เปิดเผยข้อมูลผู้แจ้ง** (anonymous)
- **Water Level Guide** 4 preset (10–20,  30–50,  60–80,  ≥100 ซม.)
- เมื่อส่ง → ปักหมุดบนแผนที่อัตโนมัติ
- **Auto-Clean 7 วัน**: ตรวจ API แล้วฝน < 5 mm → ลบอัตโนมัติ

### 🚨 ศูนย์รวมเคส SOS
- กลุ่มการ์ดแยกบริเวณด้านล่าง — **ไม่เกิน 10 เคสต่อหน้า**
- การ์ดแสดง **"รอมาแล้ว X ชม."** (real-time)
- ปุ่ม **"✅ ได้รับความช่วยเหลือแล้ว"** ในทุกการ์ด → ลบเคสทันที
- **Auto-Expire 24 ชม.** → auto-resolved + แจ้งเตือน "กดส่งขอฯ ใหม่"

### 📞 คลังเบอร์ติดต่อฉุกเฉิน (22 เบอร์)
- ปุ่ม **📞 คลังเบอร์** บน Header → Modal รวม 2 หมวด:
  1. **หน่วยงานฉุกเฉิน & กู้ภัยหลัก (8)**:  ปภ.,  สพฉ.,  ดับเพลิง,  JS100,  สวพ.91,  กู้ชีพวชิระ ฯลฯ
  2. **ห้องฉุกเฉินโรงพยาบาลหลัก (14)**:  ศิริราช,  จุฬาลงกรณ์,  รามาธิบดี,  ราชวิถี,  ธรรมศาสตร์ ฯลฯ
- กดเบอร์โทรออกได้ทันที (`href="tel:..."`)

### 📍 Hero Banner (แก้ไข)
- **"📍 โฟกัสพื้นที่ กรุงเทพมหานคร และ ปริมณฑล"**

### 🗺️ พื้นที่ครอบคลุม
- กรุงเทพฯ 50 เขต · ปริมณฑล 5 จังหวัด · ต่างจังหวัด 18 จังหวัด
- OpenStreetMap tile (ฟรี 100%, ไม่ต้อง API key)
- ❌ ไม่มี SOS Marker บนแผนที่

### 🎯 Severity คำนวณจาก cm
- `> 100` → 🚨 อพยพ / วิกฤต
- `60–100` → ⚠️ สัญจรไม่ได้ / วิกฤต
- `30–60` → 🟡 สัญจรลำบาก / เฝ้าระวัง

### 🎨 Design — Clean Light Mode

## ✨ Features

### 📋 รายงานจุดน้ำท่วม (Consolidated & Pagination)
- ธีมขาว-เทาอ่อน (#F8FAFC / #FFFFFF)
- Modal responsive: mobile slide-up / desktop centered
- Animation: slideUp, fadeIn, pulse

## 🛠️ Tech Stack

- **React 18** + **Vite 5** (JavaScript)
- **Tailwind CSS 3**
- **Leaflet 1.9** + **react-leaflet 4.2** (`Polyline`, `Polygon`, `Marker`)
- **lucide-react** icons
- Open-Meteo public API + OpenStreetMap tiles

## 📦 การติดตั้ง

ต้องมี Node.js 18+ (แนะนำ 20+) และ npm

```bash
npm install
```

> 💡 ถ้ารันบน WSL/Linux แล้วเจอ error `Cannot find module '@rollup/rollup-linux-x64-gnu'`
> ให้รัน: `npm install @rollup/rollup-linux-x64-gnu` เพิ่ม

## 🚀 การรัน Dev Server

```bash
npm run dev
```

Dev server จะรันที่ **http://localhost:3005** (ตั้ง `strictPort: true` ไว้แล้ว
ถ้า port ว่าง — ถ้า port ชน Vite จะ **ไม่** เปลี่ยนไป port อื่นให้อัตโนมัติ)

## 🏗️ การ Build Production

```bash
npm run build
npm run preview   # เสิร์ฟ dist/ ที่ port 3005
```

## 🗂️ โครงสร้างโปรเจกต์

```
rainthai/
├── index.html
├── package.json
├── vite.config.js        # port 3005, strictPort: true
├── tailwind.config.js
├── postcss.config.js
├── public/favicon.svg
└── src/
    ├── main.jsx          # entry + แก้ปัญหา Leaflet icon
    ├── App.jsx           # หน้าจอหลัก (Header + Map + Sidebar + Flood section)
    ├── index.css         # Clean Light theme + Leaflet base + animations
    ├── components/
    │   ├── Header.jsx              # sticky header + view switcher
    │   ├── RainMap.jsx             # Leaflet MapContainer + 2 marker แบบ
    │   ├── Legend.jsx              # สัญลักษณ์ระดับความเสี่ยง
    │   ├── ProvinceCard.jsx        # การ์ดจังหวัด (คลิกได้)
    │   ├── FloodCard.jsx           # การ์ดรายงานจุดน้ำท่วม
    │   ├── DrillDownPanel.jsx      # drill-down อำเภอ → ตำบล (ต่างจังหวัด)
    │   ├── DistrictPanel.jsx       # ✨ drill-down เขตกทม. (50 เขต)
    │   ├── SOSPanel.jsx            # ✨ panel แสดง SOS card 5 จุด
    │   ├── SearchBar.jsx           # search box พร้อม clear
    │   └── LoadingOverlay.jsx
    ├── data/
    │   ├── provinces.js     # พิกัดจังหวัดต่างจังหวัด + อำเภอ + FLOOD_REPORTS
    │   └── bangkok.js       # 50 เขต + FLOOD_ROADS + FLOOD_ZONES + SOS_REPORTS
    └── services/
        └── weatherService.js   # Open-Meteo fetch + rainLevel + deriveAmphureMock
```

## 🎨 Theme Tokens

| Token              | Value      |
| ------------------ | ---------- |
| Background page    | `#F8FAFC`  |
| Card / surface     | `#FFFFFF`  |
| Soft surface       | `#F1F5F9`  |
| Border             | `#E2E8F0`  |
| Text primary       | `#0F172A`  |
| Text secondary     | `#475569`  |
| Accent (sky/blue)  | `#2563EB`  |

## 🔧 หมายเหตุทางเทคนิค

### แก้ปัญหา Leaflet icon ใน React/Vite

Leaflet ใช้ Webpack-style asset import สำหรับ default marker icon
ซึ่ง Vite ไม่ resolve ให้อัตโนมัติ — เราแก้ที่ `src/main.jsx`:

```js
import L from 'leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl       from 'leaflet/dist/images/marker-icon.png'
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })
```

ในแอปนี้เราใช้ **custom marker** ผ่าน `L.divIcon` ใน `RainMap.jsx`:
- `rain-marker` (หยดน้ำฝน) — ตามระดับ `safe | moderate | danger`
- `flood-marker` (คลื่นน้ำ) — ตามระดับ `critical | watch | caution`

### Drill-Down Pattern

คลิก Province → state `selectedProvince` ตั้ง → flyTo บนแผนที่
→ DrillDownPanel แสดง amphure list → คลิก amphure → แสดง tambon list
ข้อมูลอำเภอ/ตำบลใช้ `deriveAmphureMock` + `deriveTambonMock`
คำนวณจากค่าจังหวัด (mockup สมจริง — ใส่ noise ± เล็กน้อย)

### Flood Reports

`FLOOD_REPORTS` ใน `data/provinces.js` เป็น mockup 12 จุดครอบคลุม 7 จังหวัด
พร้อม:
- ชื่อชุมชน/ถนน
- ระดับน้ำโดยประมาณ
- severity tag (critical / watch / caution)
- เวลารายงาน
- หมายเหตุสั้นๆ

เมื่อคลิก FloodCard → flyTo + เลือกจังหวัดของจุดนั้นให้อัตโนมัติ

### OpenStreetMap Tile (ฟรี ไม่ต้อง API Key)

```js
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
maxZoom={19}
```

Basemap มาตรฐานฟรี 100%

## 📜 License

MIT