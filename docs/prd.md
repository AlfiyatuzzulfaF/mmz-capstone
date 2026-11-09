# PRODUCT REQUIREMENT DOCUMENT (PRD)

## Sistem Informasi Pemantauan Operasional & Manajemen Transaksi (CRUD)

**Entitas Bisnis:** MMZ Studio Foto

**Tipe Produk:** Web Application Dashboard (Admin & Owner)

**Arsitektur Pendukung:** n8n Workflow Automation, Google Calendar API, TiDB Cloud Database

**Basis Kebutuhan:** Tabel Spesifikasi Sistem (KF-01 s.d. KF-13 & KNF-01 s.d. KNF-05)

## 1. Pendahuluan & Latar Belakang

### 1.1 Masalah Bisnis

Proses reservasi di MMZ Studio Foto sebelumnya mengandalkan pencatatan manual via WhatsApp dan entri sepihak di Google Calendar. Hal ini memicu risiko jadwal ganda (*double booking*), ketiadaan riwayat status pembayaran uang muka (DP), serta keterbatasan bagi admin dan pemilik (*owner*) dalam memantau kapasitas 2 ruangan studio (Studio 1 dan Studio 2) dan tren pendapatan harian secara terpusat.

### 1.2 Tujuan Produk

Membangun antarmuka web dashboard terpusat yang:

1. Menyajikan visualisasi metrik bisnis (KPI) dan jadwal sesi foto secara *real-time* langsung dari basis data TiDB Cloud yang terintegrasi dengan otomatisasi n8n (**KF-13**).

2. Menyediakan modul kendali administrasi manual (RUD: *Read, Update, Delete*) bagi admin studio untuk menangani pesanan langsung (*walk-in*), pembaruan status pembayaran (DP/Lunas), dan pembatalan (*soft delete*).

### 1.3 Pengguna Target (User Personas)

* **Admin Studio:** Memeriksa antrean sesi harian, menginput pemesanan manual *walk-in*, memverifikasi pelunasan sisa tagihan di kasir, dan mengatur status booking.

* **Pemilik Studio (Owner):** Memantau akumulasi DP/pendapatan, mengevaluasi utilisasi ruang Studio 1 vs Studio 2, dan melihat tren paket foto terpopuler.

## 2. Pemetaan Kebutuhan Sistem (KF & KNF)

### 2.1 Pemetaan Kebutuhan Fungsional (Functional Requirements)

| Kode | Kebutuhan Fungsional Eksisting | Peran & Implementasi pada Web Dashboard | 
| ----- | ----- | ----- | 
| **KF-01** | Sistem dapat menerima pesan *booking* dari *customer* melalui WhatsApp via *webhook*. | Alur n8n menerima webhook; dashboard menyajikan hasil akhir pesan yang terekam. | 
| **KF-02** | Sistem dapat melakukan *screening* pesan untuk membedakan permintaan *booking* dan pesan umum. | Ditangani n8n; dashboard hanya menampilkan data yang lolos screening. | 
| **KF-03** | Sistem dapat mengekstraksi data tanggal dan jam dari pesan awal *customer*. | Parameter hasil ekstraksi menjadi penentu slot jadwal yang tampil di dashboard. | 
| **KF-04** | Sistem dapat memvalidasi kelengkapan serta keabsahan data tanggal dan jam. | Formulir manual di dashboard mengadopsi validasi kelayakan tanggal/jam yang sama. | 
| **KF-05** | Sistem dapat memeriksa ketersediaan slot jadwal pada Google Calendar secara otomatis. | Backend dashboard memvalidasi slot Google Calendar sebelum transaksi manual disetujui. | 
| **KF-06** | Sistem dapat mengirimkan *template* teks format *Fix Booking* jika jadwal tersedia. | Ditangani n8n; dashboard menyediakan format isian serupa pada modul Create. | 
| **KF-07** | Sistem dapat memvalidasi kelengkapan dan format data balasan *form* dari *customer*. | Backend n8n memvalidasi form WA; web form memvalidasi data input walk-in. | 
| **KF-08** | Sistem dapat mengirimkan notifikasi permintaan pengisian ulang formulir jika belum valid. | Form dashboard memberikan pesan error interaktif seketika jika input tidak valid. | 
| **KF-09** | Sistem dapat melakukan pengecekan ulang ketersediaan jadwal pada Google Calendar sebelum simpan. | Menjadi logika pencegahan bentrok ganda (*double booking prevention*) di web. | 
| **KF-10** | Sistem dapat menyimpan data *booking* yang tervalidasi ke dalam *database*. | Dashboard membaca dan menulis langsung ke basis data TiDB Cloud (`test.bookings`). | 
| **KF-11** | Sistem dapat membuat *event* baru otomatis pada Google Calendar dan memperbarui data *dashboard*. | Dashboard merefleksikan event baru secara instan melalui sinkronisasi state. | 
| **KF-12** | Sistem dapat mengirimkan pesan konfirmasi *booking* berhasil beserta rincian ke *customer*. | Mengirimkan trigger notifikasi WhatsApp saat admin memverifikasi transaksi. | 
| **KF-13** | Sistem dapat menampilkan data *booking* dan status transaksi secara terpusat pada *dashboard*. | **Fungsi Inti Dashboard:** Tabel operasional terpadu, KPI scorecards, dan grafik analitik. | 

### 2.2 Pemetaan Kebutuhan Non-Fungsional (Non-Functional Requirements)

| Kode | Aspek | Kriteria Terukur | Implementasi Teknis pada Dashboard | 
| ----- | ----- | ----- | ----- | 
| **KNF-01** | Keandalan (*Reliability*) | Sistem beroperasi konsisten tanpa *downtime* selama jam operasional; menangani *exception handling* otomatis. | Penanganan koneksi putus (connection retry pool), error toast notifikasi, dan fallback visual state jika query database timeout. | 
| **KNF-02** | Kegunaan (*Usability*) | Antarmuka dirancang intuitif sehingga mudah dipahami oleh *customer*, admin, dan pemilik studio. | Desain visual clean, tata letak kartu ringkasan terstruktur, badge status dengan kode warna standar (hijau, kuning, merah). | 
| **KNF-03** | Keamanan Data (*Security*) | Data pribadi *customer* (nama, no WA) dan transaksi disimpan aman; akses dashboard dibatasi pihak berwenang. | Enkripsi SSL/TLS aktif pada driver MySQL (`ssl: true`), autentikasi login sesi staf studio, perlindungan akses tabel. | 
| **KNF-04** | Waktu Respons (*Performance*) | Sistem responsif dan memproses data dengan cepat. | Waktu muat query tabel utama dan grafik analitik $\le 2$ detik; pembaruan instan saat tombol refresh ditekan. | 
| **KNF-05** | Kemudahan Pemeliharaan (*Maintainability*) | Dirancang secara modular untuk memudahkan perbaikan logika maupun penyesuaian aturan bisnis. | Arsitektur kode terpisah antara komponen UI, routing API backend, konfigurasi koneksi database, dan helper SQL. | 

## 3. Arsitektur Basis Data (TiDB Cloud)

### 3.1 Konfigurasi Lingkungan (`.env`)

```
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=4sCAPxEEYcGBndR.root
DB_PASSWORD=BC5qZqlVR9Tx3IEb
DB_NAME=test
DB_SSL=true

```

### 3.2 Kamus Entitas Relasional

1. **`bookings` (Fakta Transaksi):** Menyimpan transaksi pemesanan (`id_booking`, `id_customer`, `id_paket`, `id_lokasi`, id_admin,`tanggal_booking`, `jam_booking`, `jam_selesai`, `nominal_dp`, `status_pembayaran`, `status_booking`, id_event_calendar,`catatan`, `created_at`, `updated_at`).

2. **`customers` (Master Pelanggan):** Identitas pelanggan (`id_customer`, `nama_customer`, `no_whatsapp, created_at`).

3. **`paket_layanan` (Master Paket):** Katalog layanan (`id_paket`, `nama_paket`, `durasi_menit`, `harga`, `status_aktif`).

4. **`lokasi` (Master Ruangan):** Ruang fisik studio (`id_lokasi`, `nama_lokasi`, `alamat`). Nilai: Studio 1 dan Studio 2.

5. **`admin` (Master Staf):** Data pengguna pengelola (`id_admin`, `nama_admin`).

6. **`sesi_percakapan` (State Bot n8n):** Pengingat sesi chat percakapan WhatsApp (id_sesi, no_whatsapp, tahap, tanggal_diminta, jam_diminta, updated_at).

## 4. Spesifikasi Fungsional Dashboard & Modul CRUD

### 4.1 Filter Global & Kontrol Navigasi

* **Date Range Control:** Memfilter transaksi berdasarkan rentang `tanggal_booking`.

* **Dropdown Studio:** Opsi filter: `Semua Ruangan`, `Studio 1`, atau `Studio 2`.

* **Dropdown Status Pembayaran:** Opsi filter: `Semua`, `belum_dibayar`, `dp_diterima`, `lunas`.

* **Tombol Refresh Data:** Menarik data transaksi terbaru tanpa memuat ulang (*reload*) browser.

### 4.2 Kartu Ringkasan KPI (Scorecards)

1. **Total Booking:** `COUNT(id_booking)` dari transaksi aktif (`status_booking != 'batal'`).

2. **Total Akumulasi DP:** `SUM(nominal_dp)` untuk rekapitulasi dana masuk.

3. **Pemesanan Terkonfirmasi:** `COUNT(id_booking)` dengan kriteria `status_booking = 'terkonfirmasi'`.

4. **Menunggu Pelunasan:** `COUNT(id_booking)` dengan kriteria `status_pembayaran = 'dp_diterima'`.

### 4.3 Modul Read: Tabel Operasional Jadwal (Mendukung KF-13)

Menampilkan daftar reservasi terstruktur dengan kueri relasi:

* **Kolom Tampilan:**

  1. *Waktu Sesi:* `tanggal_booking` dan rentang `jam_booking - jam_selesai`.

  2. *Studio:* `nama_lokasi` (Badge Biru untuk Studio 1, Badge Hijau untuk Studio 2).

  3. *Nama Customer:* `nama_customer`.

  4. *Kontak WA:* `no_whatsapp` (disertai tombol tautan langsung ke WhatsApp).

  5. *Paket & Background:* `nama_paket` dan detail catatan variasi background foto.

  6. *Nominal DP:* Format mata uang (contoh: `Rp 50.000`).

  7. *Status Pembayaran:* Badge status (`belum_dibayar`, `dp_diterima`, `lunas`).

  8. *Status Booking:* Badge status (`menunggu_dp`, `terkonfirmasi`, `batal`, `reschedule`).

  9. *Aksi:* Tombol **Edit Status** dan **Batalkan**.

* **Pengurutan Default:** `tanggal_booking ASC`, `jam_booking ASC` (jadwal terdekat berada paling atas).

### 4.4 Modul Update: Penyesuaian Status & Reschedule

* **Pelunasan Kasir:** Mengubah status pembayaran dari `menunggu_dp` menjadi `dp_diterima dan lunas`saat sesi selesai.

* **Reschedule Jadwal:** Mengubah tanggal atau jam pemesanan dengan kewajiban menjalankan validasi bentrok jadwal terlebih dahulu.

### 4.5 Modul Delete: Pembatalan Pemesanan (*Soft Delete*)

* **Aturan Bisnis:** Sistem **DILARANG** menghapus baris data secara permanen (`DELETE FROM`).

* **Eksekusi:** Tombol "Batalkan" mengeksekusi *soft delete*:

  ```
  UPDATE test.bookings 
  SET status_booking = 'batal', updated_at = CURRENT_TIMESTAMP 
  WHERE id_booking = :id_booking;
  
  ```

  Status `batal` otomatis membebaskan slot ruangan kalender untuk pemesan lain serta menjaga keutuhan riwayat pembukuan DP *non-refundable*.

## 5. Kueri SQL Terpadu untuk Developer

### 5.1 Kueri Tabel Operasional

```
SELECT 
    b.id_booking,
    c.nama_customer,
    c.no_whatsapp,
    p.nama_paket,
    p.harga AS harga_paket,
    l.nama_lokasi AS studio,
    b.tanggal_booking,
    b.jam_booking,
    b.jam_selesai,
    b.nominal_dp,
    b.status_pembayaran,
    b.status_booking,
    b.catatan AS background_detail,
    b.created_at
FROM test.bookings b
JOIN test.customers c ON b.id_customer = c.id_customer
JOIN test.paket_layanan p ON b.id_paket = p.id_paket
JOIN test.lokasi l ON b.id_lokasi = l.id_lokasi
ORDER BY b.tanggal_booking ASC, b.jam_booking ASC;

```

### 5.2 Kueri Agregasi Kartu KPI

```
SELECT 
    COUNT(id_booking) AS total_booking,
    COALESCE(SUM(nominal_dp), 0) AS total_dp_masuk,
    COUNT(CASE WHEN status_booking = 'terkonfirmasi' THEN 1 END) AS booking_terkonfirmasi,
    COUNT(CASE WHEN status_pembayaran = 'dp_diterima' THEN 1 END) AS menunggu_pelunasan
FROM test.bookings
WHERE status_booking != 'batal';

```

### 5.3 Kueri Grafik Analitik

```
-- Grafik Batang: Paket Terlaris
SELECT p.nama_paket, COUNT(b.id_booking) AS total_terjual
FROM test.bookings b
JOIN test.paket_layanan p ON b.id_paket = p.id_paket
WHERE b.status_booking != 'batal'
GROUP BY p.nama_paket;

-- Diagram Donat: Rasio Utilisasi Studio
SELECT l.nama_lokasi AS studio, COUNT(b.id_booking) AS total_sesi
FROM test.bookings b
JOIN test.lokasi l ON b.id_lokasi = l.id_lokasi
WHERE b.status_booking != 'batal'
GROUP BY l.nama_lokasi;

```