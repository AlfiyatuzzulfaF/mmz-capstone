# ARSITEKTUR SISTEM & DESAIN TEKNIS (ARCHITECTURE.MD)

## Sistem Informasi Pemantauan Operasional & Manajemen Transaksi
**Entitas Bisnis:** MMZ Studio Foto  
**Tipe Produk:** Web Application Dashboard (Admin & Owner)  
**Teknologi Utama:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TiDB Cloud (MySQL Wire Protocol), Google Calendar API v3, n8n Workflow Automation  
**Referensi Spesifikasi:** PRD (KF-01 s.d. KF-13 & KNF-01 s.d. KNF-05)

---

## 1. Ringkasan Eksekutif & Konteks Sistem (System Context)

### 1.1 Latar Belakang & Batasan Tanggung Jawab
Sistem Informasi MMZ Studio Foto dirancang untuk menggantikan alur operasional manual berbasis WhatsApp chat dan pencatatan kalender terpisah. Arsitektur sistem membagi tanggung jawab ke dalam dua pilar operasional:
1. **Automasi Percakapan & Intake Reservasi (n8n Automation Engine):** Menangani interaksi langsung dengan pelanggan di WhatsApp (screening pesan, ekstraksi jadwal sesi, pengiriman format fix booking, dan notifikasi konfirmasi).
2. **Pusat Kendali Operasional & Transaksi (Next.js Web Dashboard):** Antarmuka terpusat bagi Admin Studio dan Pemilik (Owner) untuk memantau metrik bisnis (KPI), mengelola reservasi walk-in (Create), memverifikasi pelunasan dan reschedule (Update), membatalkan pemesanan (Soft Delete), serta sinkronisasi jadwal real-time dengan Google Calendar dan TiDB Cloud.

### 1.2 C4 Model: Diagram Konteks Sistem (Level 1)

```mermaid
flowchart TD
    Customer["Pelanggan (Customer)"]
    Admin["Admin Studio (Kasir/Frontdesk)"]
    Owner["Pemilik Studio (Owner)"]

    subgraph MMZ_System_Boundary ["Batas Sistem MMZ Studio Foto"]
        WebApp["Web Dashboard Terpusat\n(Next.js 16, React 19, Tailwind)"]
        TiDB[("TiDB Cloud Database\n(MySQL Wire Protocol via TLS/SSL)")]
        N8N["n8n Automation Engine\n(Workflow WhatsApp & Bot Sesi)"]
    end

    GCal["Google Calendar API v3\n(Kalender Studio 1 & Studio 2)"]
    WAGateway["WhatsApp Business Gateway / API"]

    %% Hubungan Customer
    Customer <-->|"Pesan Booking / Form WA (KF-01, KF-06)"| WAGateway
    WAGateway <-->|"Webhook & Messaging API"| N8N

    %% Hubungan n8n
    N8N <-->|"Ekstraksi, Screening & Update Sesi\n(KF-02, KF-03, KF-07, KF-08)"| TiDB
    N8N <-->|"Validasi Slot & Push Event (KF-05, KF-11)"| GCal

    %% Hubungan Dashboard
    Admin <-->|"Input Walk-in, Update Status,\nPelunasan & Soft Delete (KF-04, KF-10, KF-13)"| WebApp
    Owner <-->|"Pantau KPI, Utilisasi Studio & Omzet (KF-13)"| WebApp

    WebApp <-->|"Query Operasional, Transaksi & Agregasi (KNF-04)"| TiDB
    WebApp <-->|"Validasi Ketersediaan Slot & Sinkronisasi Event (KF-09, KF-11)"| GCal
    WebApp -->|"Trigger Notifikasi WhatsApp Konfirmasi (KF-12)"| N8N
```

---

## 2. Arsitektur Kontainer & Komponen (C4 Level 2 & Level 3)

### 2.1 C4 Model: Diagram Kontainer (Level 2)

```mermaid
flowchart TB
    subgraph Client_Browser ["Peramban Web (Client Tier)"]
        AdminUI["Admin & Owner Browser\n(SPA / React Server Components & Client Hydration)"]
    end

    subgraph App_Server ["Next.js Application Runtime (Node.js Engine)"]
        RouteHandlers["API Route Handlers / Server Actions\n(/api/bookings, /api/analytics, /api/calendar)"]
        ZodValidator["Schema & Input Validator\n(Zod Validation Layer)"]
        ServiceLayer["Application Service Layer\n(BookingService, CalendarSyncService, AnalyticsService)"]
        RepoLayer["Data Access / Repository Layer\n(BookingRepository, AnalyticsRepository)"]
        DBPool["TiDB Connection Pool Manager\n(mysql2/promise with SSL & Auto-Retry)"]
    end

    subgraph Data_Storage ["Database Tier"]
        TiDBInstance[("TiDB Cloud Cluster\n(Database: test, Port: 4000, SSL Enforced)")]
    end

    subgraph External_Services ["Layanan Eksternal"]
        GCalAPI["Google Calendar API v3\n(OAuth2 Service Account)"]
        N8NWebhook["n8n Webhook Endpoint\n(Outbound WA Dispatcher)"]
    end

    AdminUI <-->|"HTTPS / JSON"| RouteHandlers
    RouteHandlers --> ZodValidator
    ZodValidator --> ServiceLayer
    ServiceLayer --> RepoLayer
    RepoLayer --> DBPool
    DBPool <-->|"TLS/SSL Encrypted TCP"| TiDBInstance
    ServiceLayer <-->|"REST API over HTTPS"| GCalAPI
    ServiceLayer -->|"Webhook Trigger over HTTPS"| N8NWebhook
```

### 2.2 Lapisan Arsitektur Perangkat Lunak (Clean Layered Architecture)
Sesuai kebutuhan pemeliharaan modular (**KNF-05**), aplikasi dibangun dengan segregasi tanggung jawab yang ketat:

1. **Presentation Layer (`src/components/`, `src/app/`):**
   - Komponen UI modular: Kartu KPI (*Scorecards*), Tabel Operasional dengan *Global Filter* (Rentang tanggal, filter Studio 1/Studio 2, filter status pembayaran), Modal Walk-in Booking, Modal Reschedule, dan Grafik Interaktif.
   - Menggunakan Tailwind CSS v4 untuk performa styling zero-runtime dan rendering responsif (**KNF-02**).

2. **Validation Layer (`src/lib/validations/`):**
   - Skema Zod untuk memvalidasi kelengkapan tanggal, jam, nomor WhatsApp, durasi paket, dan nominal DP sebelum dieksekusi (**KF-04, KNF-03**).

3. **Domain / Service Layer (`src/services/`):**
   - **`BookingService`**: Menangani aturan bisnis reservasi, kalkulasi jam selesai (`jam_booking + durasi_menit`), mitigasi bentrok jadwal, dan eksekusi soft delete.
   - **`CalendarSyncService`**: Berkomunikasi dengan Google Calendar v3 API (cek bentrok slot, buat event baru, update event, dan hapus event saat pembatalan).
   - **`AnalyticsService`**: Mengompilasi metrik agregasi KPI, rasio utilisasi Studio 1 vs Studio 2, dan ranking paket foto terlaris.
   - **`NotificationService`**: Memanggil trigger webhook n8n untuk dispatch pesan WhatsApp otomatis (**KF-12**).

4. **Data Access / Repository Layer (`src/repositories/`, `src/lib/db.ts`):**
   - Mengenkapsulasi semua query SQL terpadu ke TiDB Cloud.
   - Menggunakan *Prepared Statements* berparameter untuk eliminasi risiko SQL Injection (**KNF-03**).

---

## 3. Arsitektur Basis Data (TiDB Cloud) & Skema ERD

### 3.1 Diagram Hubungan Entitas (Entity-Relationship Diagram)

```mermaid
erDiagram
    CUSTOMERS ||--o{ BOOKINGS : "memiliki riwayat"
    PAKET_LAYANAN ||--o{ BOOKINGS : "dipilih dalam"
    LOKASI ||--o{ BOOKINGS : "tempat sesi"
    ADMIN ||--o{ BOOKINGS : "diinput/dikelola oleh"
    CUSTOMERS ||--o{ SESI_PERCAKAPAN : "melakukan chat"

    CUSTOMERS {
        int id_customer PK "Auto Increment"
        varchar nama_customer "Nama Lengkap"
        varchar no_whatsapp "Format E.164 (628xxx)"
        timestamp created_at "Default CURRENT_TIMESTAMP"
    }

    PAKET_LAYANAN {
        int id_paket PK "Auto Increment"
        varchar nama_paket "Nama Katalog Paket"
        int durasi_menit "Durasi Pemotretan (Menit)"
        decimal harga "Harga Paket (IDR)"
        tinyint status_aktif "1 = Aktif, 0 = Nonaktif"
    }

    LOKASI {
        int id_lokasi PK "1 = Studio 1, 2 = Studio 2"
        varchar nama_lokasi "Studio 1 / Studio 2"
        text alamat "Alamat Fisik Studio"
    }

    ADMIN {
        int id_admin PK "Auto Increment"
        varchar nama_admin "Nama Pengguna Staf"
        varchar email "Email Login"
        varchar role "admin / owner"
    }

    BOOKINGS {
        int id_booking PK "Auto Increment"
        int id_customer FK "Relasi ke customers"
        int id_paket FK "Relasi ke paket_layanan"
        int id_lokasi FK "Relasi ke lokasi"
        int id_admin FK "Relasi ke admin (nullable)"
        date tanggal_booking "Tanggal Pemotretan"
        time jam_booking "Jam Mulai (HH:mm)"
        time jam_selesai "Jam Selesai (HH:mm)"
        decimal nominal_dp "Uang Muka Diterima (IDR)"
        enum status_pembayaran "belum_dibayar, dp_diterima, lunas"
        enum status_booking "menunggu_dp, terkonfirmasi, batal, reschedule"
        varchar id_event_calendar "ID Referensi Google Calendar Event"
        text catatan "Detail Background & Request Tambahan"
        timestamp created_at "Waktu Transaksi Dibuat"
        timestamp updated_at "Waktu Terakhir Diperbarui"
    }

    SESI_PERCAKAPAN {
        int id_sesi PK "Auto Increment"
        varchar no_whatsapp "Identitas Kontak Chat"
        varchar tahap "State Mesin n8n"
        date tanggal_diminta "Draft Tanggal"
        time jam_diminta "Draft Jam"
        timestamp updated_at "Update Terakhir"
    }
```

### 3.2 Kamus Data & Integritas Relasional
1. **Aturan Soft Delete (Sesuai PRD Bab 4.5):**
   - Transaksi yang dibatalkan **TIDAK DIHAPUS SECARA FISIK** (`DELETE FROM`).
   - Pembatalan wajib mengeksekusi:
     ```sql
     UPDATE test.bookings 
     SET status_booking = 'batal', updated_at = CURRENT_TIMESTAMP 
     WHERE id_booking = ?;
     ```
   - Rekam jejak `nominal_dp` non-refundable tetap tersimpan untuk audit buku kas studio.
2. **Constraint & Tipe Data Penting:**
   - `nominal_dp` dan `harga` bertipe `DECIMAL(12, 2)` untuk mencegah kesalahan pembulatan floating point pada mata uang IDR.
   - Kolom `status_pembayaran` dibatasi nilai: `'belum_dibayar'`, `'dp_diterima'`, `'lunas'`.
   - Kolom `status_booking` dibatasi nilai: `'menunggu_dp'`, `'terkonfirmasi'`, `'batal'`, `'reschedule'`.

### 3.3 Indeks Database untuk Menjamin Waktu Respons $\le 2$ Detik (KNF-04)
Untuk menjamin query tabel operasional dan analitik berjalan sub-detik bahkan saat volume reservasi membesar, indeks komposit berikut diterapkan pada tabel `bookings`:
* **`idx_bookings_schedule`**: `(tanggal_booking, jam_booking, id_lokasi)` $\rightarrow$ Mempercepat kueri filter tanggal dan pengecekan bentrok slot.
* **`idx_bookings_status`**: `(status_booking, status_pembayaran)` $\rightarrow$ Mengoptimalkan agregasi Scorecards KPI.
* **`idx_bookings_customer`**: `(id_customer)` $\rightarrow$ Akses riwayat pelanggan.

### 3.4 Ketahanan Koneksi TiDB Cloud (KNF-01 & KNF-03)
TiDB Cloud berjalan pada protokol MySQL melalui jaringan aman (Port 4000) dengan TLS/SSL wajib. Implementasi pool koneksi dirancang dengan konfigurasi resilien:
```typescript
// Konfigurasi Pool Koneksi Resilien (src/lib/db.ts)
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'test',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 5,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});
```

---

## 4. Alur Transaksi & Diagram Sekuensial (Sequence Diagrams)

### 4.1 Alur 1: Pemesanan Manual (Walk-in Booking) & Pencegahan Bentrok
Alur ini mencakup pemenuhan kebutuhan **KF-04, KF-05, KF-09, KF-10, KF-11, dan KF-12**:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Studio (Kasir)
    participant UI as Web Dashboard UI
    participant API as Booking Server Action
    participant GCal as Google Calendar API v3
    participant DB as TiDB Cloud
    participant n8n as n8n Webhook Service
    actor Cust as Customer (WhatsApp)

    Admin->>UI: Isi Form Walk-in (Nama, WA, Studio, Paket, Tanggal, Jam, DP)
    UI->>API: Submit Reservasi Walk-in
    
    rect rgb(240, 248, 255)
        note over API, DB: Tahap 1: Validasi Bentrok Jadwal (KF-09)
        API->>DB: Query Cek Slot di TiDB (Studio, Tanggal, Jam, status != 'batal')
        DB-->>API: Status Ketersediaan Database (Kosong / Bentrok)
        API->>GCal: Query Ketersediaan Slot Google Calendar (Primary & Secondary)
        GCal-->>API: Status Event Kalender
    end

    alt Slot Sudah Terisi (Bentrok)
        API-->>UI: Response Error: "Slot Jadwal Sudah Terisi"
        UI-->>Admin: Tampilkan Pesan Peringatan & Rekomendasi Jam Lain
    else Slot Tersedia
        rect rgb(245, 255, 245)
            note over API, DB: Tahap 2: Transaksi Penyimpanan & Pembuatan Event
            API->>DB: INSERT / UPDATE Data Pelanggan (customers)
            API->>GCal: Insert Event Baru ke Kalender Studio Terkait (KF-11)
            GCal-->>API: Kembalikan event_id
            API->>DB: INSERT ke test.bookings (id_event_calendar = event_id, status='terkonfirmasi')
            DB-->>API: Transaksi Berhasil (id_booking)
            API-)n8n: POST Outbound Webhook (Trigger Notifikasi WhatsApp KF-12)
            n8n-)Cust: Kirim Pesan Konfirmasi Reservasi & Rincian Jadwal
        end
        API-->>UI: Sukses (Data Booking Baru)
        UI-->>Admin: Toast Sukses & Perbarui Tabel Operasional Seketika
    end
```

### 4.2 Alur 2: Reschedule Jadwal Sesi Foto
Mengatur perubahan tanggal atau jam dengan validasi bentrok wajib:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Studio
    participant UI as Modal Reschedule
    participant API as Reschedule Action
    participant GCal as Google Calendar API
    participant DB as TiDB Cloud

    Admin->>UI: Pilih Jadwal Baru (Tanggal & Jam Baru)
    UI->>API: Request Validasi & Reschedule (id_booking, new_date, new_time)
    
    API->>DB: Periksa Ketersediaan Slot Baru di TiDB
    API->>GCal: Periksa Ketersediaan Slot di Google Calendar
    
    alt Slot Baru Bentrok
        API-->>UI: Kembalikan Galat: "Jadwal tujuan tidak tersedia"
    else Slot Baru Valid
        API->>GCal: PATCH Event Kalender (update start/end time)
        API->>DB: UPDATE test.bookings SET tanggal_booking=?, jam_booking=?, jam_selesai=?, status_booking='reschedule', updated_at=NOW()
        DB-->>API: OK
        API-->>UI: Sukses Reschedule
        UI-->>Admin: Jadwal pada tabel operasional otomatis tergeser
    end
```

### 4.3 Alur 3: Pelunasan Sisa Pembayaran di Kasir
Mengatur update status pembayaran dari `dp_diterima` atau `belum_dibayar` menjadi `lunas` saat sesi foto berlangsung:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Studio
    participant UI as Baris Tabel Operasional
    participant API as Update Payment Action
    participant DB as TiDB Cloud

    Admin->>UI: Klik "Tandai Lunas" pada Reservasi
    UI->>API: POST /api/bookings/{id}/settle-payment
    API->>DB: UPDATE test.bookings SET status_pembayaran = 'lunas', updated_at = CURRENT_TIMESTAMP WHERE id_booking = ?
    DB-->>API: Query Berhasil
    API-->>UI: Status Terverifikasi Lunas
    UI-->>Admin: Badge berubah Hijau ("lunas"), Scorecard KPI "Menunggu Pelunasan" berkurang
```

### 4.4 Alur 4: Pembatalan Sesi (Soft Delete)
Menjamin kepatuhan aturan bisnis PRD Bab 4.5:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Studio
    participant UI as Konfirmasi Pembatalan Modal
    participant API as Cancel Booking Action
    participant GCal as Google Calendar API
    participant DB as TiDB Cloud

    Admin->>UI: Klik "Batalkan" & Konfirmasi Alasan
    UI->>API: POST /api/bookings/{id}/cancel
    
    API->>DB: UPDATE test.bookings SET status_booking = 'batal', updated_at = CURRENT_TIMESTAMP WHERE id_booking = ?
    API->>GCal: DELETE Event atau UPDATE Event Summary "[BATAL]" (Membebaskan Slot Kalender)
    DB-->>API: Berhasil
    
    API-->>UI: Booking Dibatalkan
    UI-->>Admin: Badge berubah Merah ("batal"), Slot studio kembali bebas untuk pelanggan lain
```

---

## 5. Integrasi Eksternal & Kontrak Layanan (External Integrations)

### 5.1 Integrasi Google Calendar API v3
* **Model Autentikasi:** Menggunakan Google Cloud Service Account (JWT Credentials) dengan delegasi domain-wide atau akses share langsung ke masing-masing ID Kalender Studio:
  - `GOOGLE_CALENDAR_STUDIO_1_ID` (ID Kalender Studio 1)
  - `GOOGLE_CALENDAR_STUDIO_2_ID` (ID Kalender Studio 2)
* **Metadata Event yang Disinkronkan:**
  ```json
  {
    "summary": "MMZ [Studio 1] - [Nama Customer] ([Nama Paket])",
    "description": "ID Booking: #1024\nWA: 628123456789\nStatus: Terkonfirmasi\nCatatan: Background Putih Polos",
    "start": { "dateTime": "2026-11-15T10:00:00+07:00", "timeZone": "Asia/Jakarta" },
    "end": { "dateTime": "2026-11-15T11:00:00+07:00", "timeZone": "Asia/Jakarta" }
  }
  ```

### 5.2 Integrasi n8n Workflow Automation
* **Inbound ke TiDB (Workflow n8n):**
  - n8n mengolah webhook pesan masuk WhatsApp $\rightarrow$ mengekstrak tanggal & jam $\rightarrow$ memvalidasi ketersediaan kalender $\rightarrow$ mencatat sesi ke `sesi_percakapan` $\rightarrow$ setelah fix, menyimpan booking ke `test.bookings`.
* **Outbound dari Web Dashboard ke n8n:**
  - Endpoint: `POST ${N8N_WEBHOOK_URL}/booking-confirmed`
  - Payload:
    ```json
    {
      "event": "BOOKING_VERIFIED",
      "id_booking": 1024,
      "customer_name": "Rian Pratama",
      "phone_number": "6281234567890",
      "studio": "Studio 1",
      "package_name": "Graduation Deluxe",
      "date": "2026-11-15",
      "start_time": "10:00",
      "end_time": "11:00",
      "nominal_dp": 50000,
      "status_pembayaran": "dp_diterima"
    }
    ```

---

## 6. Arsitektur Non-Fungsional & Strategi Kualitas (Quality Attributes)

| Atribut Kualitas | Kode PRD | Strategi Arsitektur & Mitigasi Teknis |
| :--- | :--- | :--- |
| **Keandalan (*Reliability*)** | **KNF-01** | 1. **Exponential Retry Pool:** Menangani putus sambung jaringan sementara ke TiDB Cloud dengan percobaan ulang otomatis hingga 3x.<br>2. **Graceful Error Fallback:** Komponen UI menampilkan *Empty State* dan *Error Toast* jika koneksi database/API terputus, tanpa merusak keseluruhan antarmuka.<br>3. **Two-Way Consistency:** Jika push Google Calendar gagal setelah query DB berhasil, antrean log kompensasi mencatat event untuk disinkronkan kembali. |
| **Kegunaan (*Usability*)** | **KNF-02** | 1. **Badge Semantik:** Identifikasi status cepat dengan warna kontras standar:<br>  - Hijau: `lunas`, `terkonfirmasi`<br>  - Kuning/Amber: `dp_diterima`, `menunggu_dp`, `reschedule`<br>  - Merah: `belum_dibayar`, `batal`<br>  - Biru: Tag `Studio 1` \| Hijau Muda: Tag `Studio 2`<br>2. **WhatsApp Direct Link:** Tombol aksi langsung membuka tautan `https://wa.me/{no_whatsapp}` untuk mempermudah komunikasi kasir.<br>3. **Modal Dialog Konfirmasi:** Mencegah ketidaksengajaan pembatalan pesanan. |
| **Keamanan (*Security*)** | **KNF-03** | 1. **Enkripsi Transit:** Komunikasi ke TiDB Cloud diwajibkan menggunakan TLS/SSL (`rejectUnauthorized: true`).<br>2. **Parameterized Queries:** Menolak perakitan string mentah pada SQL untuk mengeliminasi celah SQL Injection.<br>3. **Otentikasi & Otorisasi:** Akses dashboard dilindungi sesi login berbasis role (`admin` vs `owner`). Data sensitif pelanggan dilindungi di sisi server. |
| **Waktu Respons (*Performance*)** | **KNF-04** | 1. **Sub-2 Detik Latensi:** Kueri agregasi kartu KPI dan tabel operasional dieksekusi dengan indeks komposit.<br>2. **Smart Refreshing:** Tombol "Refresh Data" memicu revalidasi data via Server Actions / React Router transitions tanpa *full-page browser reload*.<br>3. **Optimized Aggregations:** Menggunakan kueri SQL teroptimasi tunggal dengan agregasi kondisional (`COUNT(CASE ...)`). |
| **Kemudahan Pemeliharaan (*Maintainability*)** | **KNF-05** | 1. **Struktur Proyek Modular:** Pemisahan tegas antarlapisan (*Presentation*, *Business Logic*, *Data Access*).<br>2. **TypeScript Strict Mode:** Jaminan *type safety* menyeluruh dari skema basis data hingga props komponen UI. |

---

## 7. Struktur Direktori Proyek (Project Codebase Structure)

Struktur kode Next.js 16 App Router dirancang agar modular, teruji, dan mudah dipelihara:

```
mmz-booking-management/
├── .env.example                     # Definisi variabel lingkungan sistem
├── docs/
│   ├── prd.md                       # Product Requirement Document (PRD)
│   └── ARCHITECTURE.md              # Dokumen Arsitektur Teknis Sistem (Ini)
├── public/                          # Aset statis & logo studio
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # Layout utama dashboard (Sidebar, Header, Filter Bar)
│   │   │   ├── page.tsx             # Halaman utama: KPI Scorecards, Tabel Operasional, Charts
│   │   │   └── analytics/
│   │   │       └── page.tsx         # Halaman evaluasi mendalam untuk Owner
│   │   ├── api/
│   │   │   ├── bookings/            # Endpoint REST API Booking (CRUD)
│   │   │   ├── analytics/           # Endpoint data agregasi metrik bisnis
│   │   │   └── webhooks/
│   │   │       └── n8n/             # Penerima event pembaruan dari bot n8n
│   │   ├── globals.css              # Pengaturan Tailwind CSS v4
│   │   └── layout.tsx               # Root HTML layout & Font providers
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── kpi-scorecards.tsx   # 4 Kartu Ringkasan Metrik Bisnis
│   │   │   ├── operational-table.tsx# Tabel Operasional Jadwal Booking (KF-13)
│   │   │   ├── global-filter-bar.tsx# Kontrol Filter Tanggal, Studio, Status
│   │   │   ├── walkin-modal.tsx     # Modal Formulir Input Booking Walk-in
│   │   │   ├── reschedule-modal.tsx # Modal Penyesuaian Jadwal Sesi
│   │   │   └── status-badge.tsx     # Komponen badge status warna semantik
│   │   ├── charts/
│   │   │   ├── top-packages-chart.tsx # Grafik Batang: Paket Terlaris
│   │   │   └── studio-ratio-chart.tsx # Diagram Donat: Utilisasi Studio 1 vs 2
│   │   └── ui/                      # Komponen dasar UI (Button, Modal, Toast, Dropdown)
│   ├── lib/
│   │   ├── db.ts                    # Koneksi TiDB Cloud Pool & Error Handling (KNF-01)
│   │   ├── google-calendar.ts       # Klien SDK Google Calendar API v3
│   │   ├── n8n-client.ts            # Dispatcher webhook notifikasi ke n8n
│   │   └── utils.ts                 # Formatter mata uang Rupiah, waktu & tanggal
│   ├── repositories/
│   │   ├── booking.repository.ts    # Kueri SQL tabel bookings, customers, lokasi
│   │   └── analytics.repository.ts  # Kueri agregasi SQL untuk KPI dan Grafik
│   ├── services/
│   │   ├── booking.service.ts       # Logika bisnis booking, conflict checker & soft delete
│   │   ├── calendar-sync.service.ts # Sinkronisasi slot Google Calendar Studio 1 & 2
│   │   └── notification.service.ts  # Orkestrasi notifikasi WhatsApp
│   ├── types/
│   │   ├── booking.ts               # Interface TypeScript entitas Booking & Customer
│   │   └── database.ts              # Type definisi skema relasional TiDB
│   └── validations/
│       └── booking.schema.ts        # Zod validation schema input walk-in & reschedule
├── package.json
├── tsconfig.json
└── README.md
```

---

## 8. Panduan Variabel Lingkungan (`.env`) & Deployment

### 8.1 Variabel Lingkungan yang Dibutuhkan
```bash
# TiDB Cloud Connection (Port 4000 & SSL Mandatory)
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=4sCAPxEEYcGBndR.root
DB_PASSWORD=your_secure_password
DB_NAME=test
DB_SSL=true

# Google Calendar Integration
GOOGLE_SERVICE_ACCOUNT_EMAIL=mmz-calendar-sync@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_STUDIO_1_ID=studio1_calendar_id@group.calendar.google.com
GOOGLE_CALENDAR_STUDIO_2_ID=studio2_calendar_id@group.calendar.google.com

# n8n Automation Webhook
N8N_WEBHOOK_BASE_URL=https://n8n.yourstudio.com/webhook
N8N_WEBHOOK_AUTH_TOKEN=your_secure_webhook_token

# Application Secret
NEXTAUTH_SECRET=your_nextauth_jwt_secret
NEXTAUTH_URL=http://localhost:3000
```

### 8.2 Strategi Verifikasi & Testing
1. **Verifikasi Koneksi Basis Data TiDB:** Menguji handshake TLS/SSL dan pooling retry saat simulasi query berat.
2. **Pengujian Deteksi Bentrok Jadwal (Anti Double-Booking):** Memastikan sistem menolak input manual jika jam yang diminta sudah terisi pada studio yang sama di database atau Google Calendar.
3. **Verifikasi Soft Delete:** Memastikan eksekusi tombol "Batalkan" mengubah kolom `status_booking = 'batal'` dan melepaskan slot Google Calendar tanpa menghapus rekam baris data (`DELETE FROM` tidak pernah terpanggil).
4. **Verifikasi Latensi Kueri:** Memverifikasi kueri tabel operasional selesai di bawah ambang batas batas waktu $\le 2$ detik (**KNF-04**).
