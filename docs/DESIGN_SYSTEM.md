# DESIGN SYSTEM SPECIFICATION (DESIGN_SYSTEM.MD)
## MMZ Studio Foto — Web Application Dashboard
**Inspirasi Estetika:** Zentra Clean SaaS Dashboard Architecture  
**Filosofi Desain:** Modern High-End Minimalist, Anti-UI-Slop, High-Information Density, Tactile Light Mode  
**Basis Teknologi:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons  
**Target Pengguna:** Admin Studio (Frontdesk & Kasir) & Pemilik Studio (Owner)

---

## 1. Filosofi Desain & Prinsip Visual (Design Principles)

1. **Light & Airy Canvas (Anti-Dull, Anti-Slop):**
   - Menghindari background putih mati atau abu-abu kusam yang monoton.
   - Menggunakan warna kanvas abu-abu netral lembut (`#F4F5F7` / `#F0F2F5`) yang membingkai kartu-kartu putih bersih (`#FFFFFF`) dengan sudut melengkung besar (`rounded-3xl` / 24px).
2. **Elevasi Halus Tanpa Border Kaku (Soft Ambient Elevation):**
   - Menghindari border tebal hitam pekat atau bayangan tajam bergaya murahan.
   - Menggunakan bayangan ambient difus multi-layer (`0 10px 25px -5px rgba(0, 0, 0, 0.03)`) dipadu garis tepi ultra-subtle (`border border-neutral-100/80` atau `border border-black/[0.04]`).
3. **Pill & Kapsul Geometris (Pill-shaped Micro-interactions):**
   - Elemen interaktif utama (tab navigasi, date range picker, badge status, filter studio, micro-tags) mengadopsi bentuk kapsul melingkar penuh (`rounded-full` / pill).
4. **Tipografi Hierarkis Berani (High-Contrast Scale):**
   - Nilai metrik KPI ditampilkan sangat besar dan tegas (`text-4xl font-semibold tracking-tight`), dipadukan dengan label atas kecil berwarna abu-abu redup dan micro-badges tren.
5. **Harmonisasi Warna Fungsional & Identitas Ruang (Studio 1 vs Studio 2):**
   - Sesuai PRD, identitas ruang fisik studio ditegaskan melalui warna semantik:
     - **Studio 1:** Royal / Electric Blue (`#2563EB`)
     - **Studio 2:** Vibrant Emerald Green (`#059669`)
     - **Lunas / Terkonfirmasi:** Emerald Soft
     - **DP Diterima / Menunggu DP:** Warm Amber
     - **Batal:** Soft Crimson / Rose
6. **Hero Visual Accent (Glassmorphism & Rich Sunset Mesh):**
   - Kartu evaluasi analitik Owner menggunakan latar belakang gradien hangat-ke-dingin (*sunset to indigo mesh*) berpadu tipografi putih berpendar dan elemen *frosted glass*.

---

## 2. Token Warna & Palet (Color Palette & Semantic Tokens)

### 2.1 Netral & Permukaan (Neutrals & Surfaces)

| Token Nama | Hex Code | Penggunaan di Antarmuka |
| :--- | :--- | :--- |
| `surface-canvas` | `#F4F5F7` | Latar belakang dasar halaman aplikasi (canvas wrapper) |
| `surface-card` | `#FFFFFF` | Latar kartu utama (Scorecards, Tabel, Chart cards) |
| `surface-subtle` | `#F8F9FA` | Latar input form, header tabel, dan dropdown list hover |
| `surface-dark-pill` | `#18181B` | Latar tab navigasi aktif (Zentra-style active pill) |
| `border-subtle` | `#E5E7EB` | Garis batas sangat tipis pada tombol kapsul dan divider |
| `border-card` | `rgba(0, 0, 0, 0.04)` | Border perimeter kartu untuk kontras di layar HDR |
| `text-primary` | `#111827` | Heading utama, nilai metrik KPI, teks tebal |
| `text-secondary` | `#4B5563` | Teks isi, label form, teks tabel |
| `text-muted` | `#9CA3AF` | Subtitle kecil, placeholder input, tanggal lampau |

### 2.2 Identitas Studio & Aksen Primer

| Token Nama | Hex Code | Tailwind Utility | Penggunaan Fungsional |
| :--- | :--- | :--- | :--- |
| `studio-1-primary` | `#2563EB` | `bg-blue-600` / `text-blue-600` | Tag utama Studio 1, garis chart Studio 1 |
| `studio-1-subtle` | `#EFF6FF` | `bg-blue-50` / `border-blue-200` | Badge latar Studio 1 pada tabel operasional |
| `studio-2-primary` | `#059669` | `bg-emerald-600` / `text-emerald-600` | Tag utama Studio 2, garis chart Studio 2 |
| `studio-2-subtle` | `#ECFDF5` | `bg-emerald-50` / `border-emerald-200` | Badge latar Studio 2 pada tabel operasional |
| `brand-accent` | `#F97316` | `bg-orange-500` | Aksen logo & highlight branding MMZ |

### 2.3 Status Transaksi & Pembayaran (Semantic Badges)

| Status | Badge Background | Teks & Ikon | Border | Indikasi Bisnis |
| :--- | :--- | :--- | :--- | :--- |
| `lunas` | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200/80` | Pembayaran selesai 100% |
| `dp_diterima` | `bg-amber-50` | `text-amber-700` | `border-amber-200/80` | DP diterima, menunggu pelunasan |
| `belum_dibayar` | `bg-neutral-100` | `text-neutral-600` | `border-neutral-200` | Menunggu pembayaran uang muka |
| `terkonfirmasi` | `bg-blue-50` | `text-blue-700` | `border-blue-200/80` | Jadwal fix & event kalender aktif |
| `reschedule` | `bg-purple-50` | `text-purple-700` | `border-purple-200/80` | Jadwal digeser ke slot baru |
| `batal` | `bg-rose-50` | `text-rose-700` | `border-rose-200/80` | Pesanan dibatalkan (*soft delete*) |

### 2.4 Gradien Hero & Glassmorphic Accent (Owner Insight Card)
```css
/* Card Gradien Sunset-to-Ocean */
background: linear-gradient(135deg, #FF6B4A 0%, #D946EF 45%, #1E3A8A 100%);

/* Frosted Glass Pill di dalam Card */
background: rgba(255, 255, 255, 0.18);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.28);
color: #FFFFFF;
```

---

## 3. Tipografi & Skala Teks (Typography Scale)

* **Font Utama:** `Plus Jakarta Sans` atau `Inter` (Fallback: `system-ui, -apple-system, sans-serif`).
* **Karakteristik Tipografi:** Geometric modern sans-serif dengan *tight tracking* pada judul besar dan *relaxed leading* pada tabel data.

| Tingkat | Ukuran (Size/Line Height) | Weight | Tracking | Contoh Pemakaian |
| :--- | :--- | :--- | :--- | :--- |
| **KPI Display** | `36px / 44px` (`text-4xl`) | `font-semibold` (600) | `tracking-tight` (-0.025em) | `$41,540`, `106k`, `Rp 4.500.000` |
| **Page Title** | `28px / 34px` (`text-2xl` - `text-3xl`) | `font-bold` (700) | `tracking-tight` (-0.02em) | `Overview`, `Jadwal & Reservasi` |
| **Card Header** | `18px / 24px` (`text-lg`) | `font-semibold` (600) | `tracking-normal` | `Payments`, `Tabel Operasional Sesi` |
| **KPI Subtitle** | `13px / 18px` (`text-xs`) | `font-medium` (500) | `tracking-wide` | `vs periode lalu`, `Akumulasi DP` |
| **Table Head** | `11px / 16px` (`text-[11px]`) | `font-semibold` (600) | `uppercase tracking-wider` | `WAKTU SESI`, `STUDIO`, `CUSTOMER` |
| **Body / Data** | `14px / 20px` (`text-sm`) | `font-normal` (400) & `500` | `tracking-normal` | Isi tabel, catatan, durasi paket |
| **Pill / Badges**| `12px / 16px` (`text-xs`) | `font-semibold` (600) | `tracking-normal` | Badge status, dropdown label |

---

## 4. Spacing, Geometri Sudut (Radius), & Bayangan (Shadows)

### 4.1 Geometri Radius (Border Radius)
* **`rounded-3xl` (`24px`):** Wadah kartu utama (Container Scorecard, Container Table, Chart Card).
* **`rounded-2xl` (`16px`):** Wadah nested / sub-cards, modal dialog, popover filter.
* **`rounded-xl` (`12px`):** Input field, dropdown select menu, text area.
* **`rounded-full` (`9999px`):** Seluruh tombol kapsul navigasi, filter pill, search pill, status badges, avatar.

### 4.2 Sistem Elevasi & Bayangan (Elevation Tokens)
```css
/* Card Ambient Diffuse Shadow (Zentra Style) */
box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 1px 3px 0 rgba(0, 0, 0, 0.02);

/* Hover State Card Elevation */
box-shadow: 0 10px 30px -4px rgba(0, 0, 0, 0.06), 0 2px 6px 0 rgba(0, 0, 0, 0.03);

/* Modal & Popover Floating Shadow */
box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.05);
```

---

## 5. Spesifikasi Komponen & Kode Tailwind CSS

### 5.1 Topbar Navigation Bar (Pill Tabs)
Navigasi atas horizontal dengan tab aktif berbentuk kapsul hitam pekat kontras tinggi:

```tsx
// Contoh Struktur Komponen Topbar Navigasi
<header className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
  {/* Logo MMZ Studio */}
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-orange-500/30">
      M
    </div>
    <span className="font-bold text-xl tracking-tight text-neutral-900">
      mmz<span className="text-neutral-400 font-light">studio</span>
    </span>
  </div>

  {/* Pill Navigation Bar */}
  <nav className="hidden md:flex items-center gap-1 bg-neutral-100/70 p-1 rounded-full border border-neutral-200/50">
    <button className="px-4 py-1.5 rounded-full bg-neutral-900 text-white text-sm font-medium shadow-sm transition-all">
      Overview
    </button>
    <button className="px-4 py-1.5 rounded-full text-neutral-600 hover:text-neutral-950 text-sm font-medium transition-colors">
      Jadwal Sesi
    </button>
    <button className="px-4 py-1.5 rounded-full text-neutral-600 hover:text-neutral-950 text-sm font-medium transition-colors">
      Pelanggan
    </button>
    <button className="px-4 py-1.5 rounded-full text-neutral-600 hover:text-neutral-950 text-sm font-medium transition-colors">
      Paket Layanan
    </button>
    <button className="px-4 py-1.5 rounded-full text-neutral-600 hover:text-neutral-950 text-sm font-medium transition-colors">
      Laporan Finansial
    </button>
  </nav>

  {/* Utility Icons & Profile */}
  <div className="flex items-center gap-2">
    <button className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors">
      <Search className="w-4 h-4" />
    </button>
    <button className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 relative transition-colors">
      <Bell className="w-4 h-4" />
      <span className="w-2 h-2 rounded-full bg-orange-500 absolute top-2 right-2 ring-2 ring-white" />
    </button>
    <div className="w-9 h-9 rounded-full bg-neutral-800 text-white flex items-center justify-center font-semibold text-xs border border-white shadow-sm ml-1">
      AD
    </div>
  </div>
</header>
```

---

### 5.2 Header Halaman & Kontrol Filter Global (Pill Filters)
Terletak di bawah navigasi, memadukan judul besar halaman dengan filter tanggal, selector studio, dan tombol aksi:

```tsx
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
  {/* Title & Pin */}
  <div className="flex items-center gap-3">
    <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Overview</h1>
    <button className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center hover:bg-neutral-200 transition-colors">
      <Link2 className="w-3.5 h-3.5" />
    </button>
  </div>

  {/* Filter Pills Controls */}
  <div className="flex flex-wrap items-center gap-2">
    {/* Date Range Selector Pill */}
    <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs font-medium text-neutral-700 hover:border-neutral-300 cursor-pointer">
      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
      <span>1 Nov – 30 Nov</span>
      <ChevronDown className="w-3 h-3 text-neutral-400 ml-1" />
    </div>

    {/* Studio Selector Pill */}
    <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs font-medium text-neutral-700 hover:border-neutral-300 cursor-pointer">
      <span className="w-2 h-2 rounded-full bg-blue-500" />
      <span>Semua Studio</span>
      <ChevronDown className="w-3 h-3 text-neutral-400 ml-1" />
    </div>

    {/* Status Pembayaran Pill */}
    <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs font-medium text-neutral-700 hover:border-neutral-300 cursor-pointer">
      <span>Status: Semua</span>
      <ChevronDown className="w-3 h-3 text-neutral-400 ml-1" />
    </div>

    {/* Action: Refresh Data Pill */}
    <button className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200/80 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
      <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
      <span>Refresh</span>
    </button>

    {/* Action: Add Walk-in Booking Button */}
    <button className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-sm transition-all">
      <Plus className="w-3.5 h-3.5" />
      <span>Booking Walk-in</span>
    </button>
  </div>
</div>
```

---

### 5.3 Kartu Ringkasan KPI (Scorecards dengan Micro-Visuals)
Setiap kartu memiliki angka berukuran besar, label rapi, menu 3-titik di pojok kanan atas, serta indikator mikro (equalizer dot matrix atau progress bar bergaris):

```tsx
// Template KPI Card (Total Booking / Omzet DP)
<div className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between relative">
  {/* Header Card */}
  <div className="flex items-center justify-between mb-4">
    <span className="text-sm font-medium text-neutral-500">Total Akumulasi DP</span>
    <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
      <MoreHorizontal className="w-4 h-4" />
    </button>
  </div>

  {/* Nilai Utama & Micro Trend Pill */}
  <div className="flex items-baseline gap-3 mb-4">
    <span className="text-4xl font-semibold tracking-tight text-neutral-900">
      Rp 8,450k
    </span>
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
      <ArrowUpRight className="w-3 h-3" /> 18.2%
    </span>
  </div>

  {/* Micro Visual: Segmented / Striped Progress Bars */}
  <div className="space-y-2 pt-2 border-t border-neutral-100">
    <div className="flex justify-between text-xs">
      <span className="text-neutral-500">Studio 1 (Reguler)</span>
      <span className="font-medium text-neutral-900">Rp 5.200.000</span>
    </div>
    {/* Striped Gradient Bar */}
    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
      <div 
        className="h-full bg-blue-600 rounded-full" 
        style={{ width: '62%', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px)' }}
      />
    </div>

    <div className="flex justify-between text-xs pt-1">
      <span className="text-neutral-500">Studio 2 (Self-Photo)</span>
      <span className="font-medium text-neutral-900">Rp 3.250.000</span>
    </div>
    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
      <div 
        className="h-full bg-emerald-500 rounded-full" 
        style={{ width: '38%', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px)' }}
      />
    </div>
  </div>
</div>
```

---

### 5.4 Kartu Analitik Hero Bergradien (Sunset-to-Indigo Insight Card)
Kartu evaluasi Owner yang memadukan visual gradien dinamis dengan teks putih bersih dan tombol kapsul frosted-glass:

```tsx
<div className="rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-lg"
     style={{ background: 'linear-gradient(135deg, #FF6F61 0%, #E040FB 40%, #1E3A8A 100%)' }}>
  {/* Top Badge: Frosted Glass Pill */}
  <div className="flex items-center justify-between mb-6">
    <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-medium flex items-center gap-1.5 shadow-sm">
      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
      <span>Insight Owner</span>
    </div>
    <button className="text-white/70 hover:text-white transition-colors">
      <MoreHorizontal className="w-4 h-4" />
    </button>
  </div>

  {/* Display Stat */}
  <div className="mb-4">
    <div className="text-5xl font-bold tracking-tight mb-2">84%</div>
    <h3 className="text-lg font-semibold text-white/95 leading-snug">
      Utilisasi Studio 1 meningkat 12% minggu ini.
    </h3>
    <p className="text-xs text-white/80 mt-1 leading-relaxed">
      Paket Wisuda Deluxe menyumbang 65% total reservasi slot akhir pekan.
    </p>
  </div>

  {/* Bottom Micro Indicator */}
  <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden mt-2">
    <div className="h-full bg-white rounded-full" style={{ width: '84%' }} />
  </div>
</div>
```

---

### 5.5 Tabel Operasional Jadwal (KF-13)
Ditempatkan di dalam kartu putih `rounded-3xl` dengan padding internal yang lapang, header abu-abu halus, hover row lembut, badge studio, dan tombol direct link WhatsApp:

```tsx
<div className="bg-white rounded-3xl p-6 border border-neutral-100/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
  {/* Table Header Bar */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">Jadwal Sesi Operasional</h2>
      <p className="text-xs text-neutral-500 mt-0.5">Daftar reservasi terkonfirmasi dan antrean kasir hari ini</p>
    </div>
    {/* Micro Search Bar */}
    <div className="relative">
      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input 
        type="text" 
        placeholder="Cari customer / paket..." 
        className="pl-8 pr-3 py-1.5 text-xs bg-neutral-100/70 border border-neutral-200/60 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:bg-white transition-all w-56"
      />
    </div>
  </div>

  {/* Table Element */}
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-neutral-100 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          <th className="py-3 px-4">WAKTU SESI</th>
          <th className="py-3 px-4">RUANG</th>
          <th className="py-3 px-4">PELANGGAN</th>
          <th className="py-3 px-4">PAKET & CATATAN</th>
          <th className="py-3 px-4">NOMINAL DP</th>
          <th className="py-3 px-4">STATUS BAYAR</th>
          <th className="py-3 px-4">STATUS BOOKING</th>
          <th className="py-3 px-4 text-right">AKSI</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100/70 text-sm">
        <tr className="hover:bg-neutral-50/70 transition-colors group">
          {/* Waktu Sesi */}
          <td className="py-3.5 px-4 whitespace-nowrap">
            <div className="font-semibold text-neutral-900">10:00 - 11:00</div>
            <div className="text-xs text-neutral-400">15 Nov 2026</div>
          </td>

          {/* Studio Badge */}
          <td className="py-3.5 px-4 whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Studio 1
            </span>
          </td>

          {/* Customer & WA Link */}
          <td className="py-3.5 px-4 whitespace-nowrap">
            <div className="font-medium text-neutral-900">Rian Pratama</div>
            <a 
              href="https://wa.me/6281234567890" 
              target="_blank" 
              className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              <MessageCircle className="w-3 h-3" /> 0812-3456-7890
            </a>
          </td>

          {/* Paket & Catatan Background */}
          <td className="py-3.5 px-4">
            <div className="font-medium text-neutral-900">Graduation Deluxe</div>
            <div className="text-xs text-neutral-500 truncate max-w-xs">Background Putih Polos + Toga</div>
          </td>

          {/* Nominal DP */}
          <td className="py-3.5 px-4 whitespace-nowrap font-medium text-neutral-900">
            Rp 50.000
          </td>

          {/* Status Pembayaran */}
          <td className="py-3.5 px-4 whitespace-nowrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/60 text-amber-700 text-xs font-medium">
              DP Diterima
            </span>
          </td>

          {/* Status Booking */}
          <td className="py-3.5 px-4 whitespace-nowrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-medium">
              Terkonfirmasi
            </span>
          </td>

          {/* Tombol Aksi */}
          <td className="py-3.5 px-4 text-right whitespace-nowrap">
            <div className="flex items-center justify-end gap-1.5">
              <button 
                title="Pelunasan Kasir" 
                className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-all"
              >
                Lunas
              </button>
              <button 
                title="Reschedule" 
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button 
                title="Batalkan Booking" 
                className="p-1 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## 6. Integrasi dengan Tailwind CSS v4

Pada `src/app/globals.css`, definisi tema dan variabel visual didaftarkan secara native:

```css
@import "tailwindcss";

@layer base {
  body {
    background-color: #F4F5F7;
    color: #111827;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    -webkit-font-smoothing: antialiased;
  }
}

/* Custom Utilities untuk Ambient Shadow & Pill Geometries */
@utility shadow-card {
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 1px 3px 0 rgba(0, 0, 0, 0.02);
}

@utility shadow-card-hover {
  box-shadow: 0 10px 30px -4px rgba(0, 0, 0, 0.06), 0 2px 6px 0 rgba(0, 0, 0, 0.03);
}

@utility glass-pill {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

---

## 7. Panduan Anti-UI-Slop & Quality Checklist

Sebelum setiap komponen UI disetujui, pastikan memenuhi checklist ini:
- [x] **Zero Harsh Borders:** Tidak ada border hitam 100% atau outline kaku (`border-neutral-100/90` atau `border-black/[0.04]` digunakan).
- [x] **Large Generous Radii:** Kartu utama menggunakan `rounded-3xl` (24px); elemen interaktif mikro menggunakan `rounded-full`.
- [x] **Clear Typographic Hierarchy:** Nilai KPI dominan (`text-4xl`), label ringkas (`text-xs text-neutral-500`), judul kartu tegas.
- [x] **Contrast Compliance:** Warna teks memenuhi standar aksesibilitas WCAG AA (kontras minimal 4.5:1 terhadap background).
- [x] **Consistent Semantics:** Studio 1 konsisten Biru, Studio 2 konsisten Hijau; Status Lunas/Terkonfirmasi Hijau, DP Diterima Amber, Batal Merah.
