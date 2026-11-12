-- ==============================================================================
-- MMZ STUDIO FOTO - SCHEMA DEFINITION & MASTER SEED SCRIPT (schema.sql)
-- Target Database: TiDB Cloud (MySQL Wire Protocol 8.0)
-- Reference: docs/prd.md (Sections 3.2 & 5) & docs/ARCHITECTURE.md (Sections 3.1 - 3.3)
-- Non-Functional Performance: KNF-04 (Sub-2-second query response with composite indices)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Table: customers (Master Pelanggan)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id_customer` INT NOT NULL AUTO_INCREMENT,
  `nama_customer` VARCHAR(100) NOT NULL COMMENT 'Nama Lengkap Pelanggan',
  `no_whatsapp` VARCHAR(20) NOT NULL COMMENT 'Format E.164 (628xxx)',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_customer`),
  KEY `idx_customers_whatsapp` (`no_whatsapp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Data Identitas Master Pelanggan';

-- ------------------------------------------------------------------------------
-- 2. Table: paket_layanan (Master Katalog Paket Layanan Foto)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `paket_layanan` (
  `id_paket` INT NOT NULL AUTO_INCREMENT,
  `nama_paket` VARCHAR(100) NOT NULL COMMENT 'Nama Katalog Paket Pemotretan',
  `durasi_menit` INT NOT NULL COMMENT 'Durasi Sesi dalam Satuan Menit',
  `harga` DECIMAL(12, 2) NOT NULL COMMENT 'Harga Dasar Paket (IDR)',
  `status_aktif` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Aktif, 0 = Nonaktif',
  PRIMARY KEY (`id_paket`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master Paket dan Tarif Layanan Foto';

-- ------------------------------------------------------------------------------
-- 3. Table: lokasi (Master Ruangan Studio)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lokasi` (
  `id_lokasi` INT NOT NULL COMMENT '1 = Studio 1, 2 = Studio 2',
  `nama_lokasi` VARCHAR(50) NOT NULL COMMENT 'Nama Identifikasi Ruangan',
  `alamat` TEXT NOT NULL COMMENT 'Alamat Fisik Ruangan Studio',
  PRIMARY KEY (`id_lokasi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master Ruang Studio Pemotretan';

-- ------------------------------------------------------------------------------
-- 4. Table: admin (Master Pengguna / Staf Studio)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin` (
  `id_admin` INT NOT NULL AUTO_INCREMENT,
  `nama_admin` VARCHAR(100) NOT NULL COMMENT 'Nama Pengguna Staf',
  `email` VARCHAR(100) NULL COMMENT 'Email Akun Staf',
  `role` ENUM('admin', 'owner') NOT NULL DEFAULT 'admin' COMMENT 'Role Hak Akses Pengguna',
  PRIMARY KEY (`id_admin`),
  UNIQUE KEY `uq_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master Akun Staf Operasional dan Pemilik';

-- Migrasi idempoten untuk kolom email dan role jika tabel admin telah ada sebelumnya
ALTER TABLE `admin` ADD COLUMN IF NOT EXISTS `email` VARCHAR(100) NULL COMMENT 'Email Akun Staf';
ALTER TABLE `admin` ADD COLUMN IF NOT EXISTS `role` ENUM('admin', 'owner') NOT NULL DEFAULT 'admin' COMMENT 'Role Hak Akses Pengguna';

-- ------------------------------------------------------------------------------
-- 5. Table: bookings (Fakta Transaksi Reservasi)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bookings` (
  `id_booking` INT NOT NULL AUTO_INCREMENT,
  `id_customer` INT NOT NULL COMMENT 'Relasi ke tabel customers',
  `id_paket` INT NOT NULL COMMENT 'Relasi ke tabel paket_layanan',
  `id_lokasi` INT NOT NULL COMMENT 'Relasi ke tabel lokasi (Studio 1 / Studio 2)',
  `id_admin` INT NULL COMMENT 'Relasi ke tabel admin penginput walk-in (nullable)',
  `tanggal_booking` DATE NOT NULL COMMENT 'Tanggal Sesi Pemotretan',
  `jam_booking` TIME NOT NULL COMMENT 'Waktu Mulai Sesi (HH:mm)',
  `jam_selesai` TIME NOT NULL COMMENT 'Waktu Berakhir Sesi (HH:mm)',
  `nominal_dp` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Nominal Uang Muka Diterima (IDR)',
  `status_pembayaran` ENUM('belum_dibayar', 'dp_diterima', 'lunas') NOT NULL DEFAULT 'belum_dibayar' COMMENT 'Status Pembayaran Kasir',
  `status_booking` ENUM('menunggu_dp', 'terkonfirmasi', 'batal', 'reschedule') NOT NULL DEFAULT 'menunggu_dp' COMMENT 'Status Reservasi',
  `id_event_calendar` VARCHAR(255) NULL COMMENT 'ID Referensi Event Google Calendar API',
  `catatan` TEXT NULL COMMENT 'Detail Variasi Background & Permintaan Khusus',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_booking`),
  -- Composite Indices to ensure sub-2-second query performance (KNF-04)
  KEY `idx_bookings_schedule` (`tanggal_booking`, `jam_booking`, `id_lokasi`),
  KEY `idx_bookings_status` (`status_booking`, `status_pembayaran`),
  KEY `idx_bookings_customer` (`id_customer`),
  -- Relational Foreign Key Constraints
  CONSTRAINT `fk_bookings_customer` FOREIGN KEY (`id_customer`) REFERENCES `customers` (`id_customer`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_paket` FOREIGN KEY (`id_paket`) REFERENCES `paket_layanan` (`id_paket`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_lokasi` FOREIGN KEY (`id_lokasi`) REFERENCES `lokasi` (`id_lokasi`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_admin` FOREIGN KEY (`id_admin`) REFERENCES `admin` (`id_admin`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel Fakta Transaksi Pemesanan Studio Foto';

-- Penegakan Indeks Komposit untuk KNF-04 Performance (Sub-2s Query)
ALTER TABLE `bookings` ADD INDEX IF NOT EXISTS `idx_bookings_schedule` (`tanggal_booking`, `jam_booking`, `id_lokasi`);
ALTER TABLE `bookings` ADD INDEX IF NOT EXISTS `idx_bookings_status` (`status_booking`, `status_pembayaran`);
ALTER TABLE `bookings` ADD INDEX IF NOT EXISTS `idx_bookings_customer` (`id_customer`);

-- ------------------------------------------------------------------------------
-- 6. Table: sesi_percakapan (State Mesin Automasi n8n)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sesi_percakapan` (
  `id_sesi` INT NOT NULL AUTO_INCREMENT,
  `no_whatsapp` VARCHAR(20) NOT NULL COMMENT 'Identitas Kontak WhatsApp',
  `tahap` VARCHAR(50) NOT NULL COMMENT 'State Mesin Percakapan Bot n8n',
  `tanggal_diminta` DATE NULL COMMENT 'Draft Tanggal Sesi Diajukan',
  `jam_diminta` TIME NULL COMMENT 'Draft Jam Sesi Diajukan',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sesi`),
  KEY `idx_sesi_whatsapp` (`no_whatsapp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='State Percakapan WhatsApp n8n';

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- INITIAL MASTER SEED DATA
-- ==============================================================================

-- 1. Master Lokasi Ruangan Studio (Studio 1 & Studio 2)
INSERT INTO `lokasi` (`id_lokasi`, `nama_lokasi`, `alamat`) VALUES
  (1, 'Studio 1', 'Jl. Veteran No. 10'),
  (2, 'Studio 2', 'Jl. Veteran No. 10 2nd Floor')
ON DUPLICATE KEY UPDATE
  `nama_lokasi` = VALUES(`nama_lokasi`),
  `alamat` = VALUES(`alamat`);

-- 2. Master Katalog Paket Layanan Foto
INSERT INTO `paket_layanan` (`id_paket`, `nama_paket`, `durasi_menit`, `harga`, `status_aktif`) VALUES
  (1, 'Self-Photo Basic', 30, 80000.00, 1),
  (2, 'Reguler Portrait', 45, 150000.00, 1),
  (3, 'Graduation Deluxe', 60, 250000.00, 1),
  (4, 'Wedding Documentation', 180, 2500000.00, 1),
  (5, 'Prewedding Studio', 120, 1200000.00, 1),
  (6, 'Engagement / Lamaran', 90, 850000.00, 1)
ON DUPLICATE KEY UPDATE
  `nama_paket` = VALUES(`nama_paket`),
  `durasi_menit` = VALUES(`durasi_menit`),
  `harga` = VALUES(`harga`),
  `status_aktif` = VALUES(`status_aktif`);

-- 3. Master Admin Staf Operasional & Owner
INSERT INTO `admin` (`id_admin`, `nama_admin`, `email`, `role`) VALUES
  (1, 'Frontdesk Staff', 'admin@mmzstudio.com', 'admin'),
  (2, 'Owner Studio', 'owner@mmzstudio.com', 'owner')
ON DUPLICATE KEY UPDATE
  `nama_admin` = VALUES(`nama_admin`),
  `email` = VALUES(`email`),
  `role` = VALUES(`role`);

-- 4. Sample Pelanggan (Customers)
INSERT INTO `customers` (`id_customer`, `nama_customer`, `no_whatsapp`) VALUES
  (1, 'Aditya Pratama', '6281234567890'),
  (2, 'Siti Rahmawati', '6281987654321'),
  (3, 'Budi Santoso', '6285712345678'),
  (4, 'Nadia Putri', '6282112233445'),
  (5, 'Rizky Ramadhan', '6287889900112')
ON DUPLICATE KEY UPDATE
  `nama_customer` = VALUES(`nama_customer`),
  `no_whatsapp` = VALUES(`no_whatsapp`);

-- 5. Realistic Sample Bookings
INSERT INTO `bookings` (
  `id_booking`, `id_customer`, `id_paket`, `id_lokasi`, `id_admin`,
  `tanggal_booking`, `jam_booking`, `jam_selesai`, `nominal_dp`,
  `status_pembayaran`, `status_booking`, `id_event_calendar`, `catatan`
) VALUES
  (
    1, 1, 1, 1, 1,
    CURDATE(), '10:00:00', '10:30:00', 50000.00,
    'dp_diterima', 'terkonfirmasi', 'cal_sample_evt_001', 'Background Abu-abu polos, sesi foto berdua'
  ),
  (
    2, 2, 2, 2, 1,
    CURDATE(), '11:00:00', '11:45:00', 150000.00,
    'lunas', 'terkonfirmasi', 'cal_sample_evt_002', 'Background Putih Studio, sesi portrait individu untuk CV'
  ),
  (
    3, 3, 3, 1, 1,
    CURDATE(), '13:00:00', '14:00:00', 100000.00,
    'dp_diterima', 'terkonfirmasi', 'cal_sample_evt_003', 'Background Wisuda Biru Navy, bawa toga & keluarga 4 orang'
  ),
  (
    4, 4, 1, 2, 1,
    DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00', '15:30:00', 0.00,
    'belum_dibayar', 'menunggu_dp', NULL, 'Pemesanan intake via bot WhatsApp, menunggu transfer DP'
  ),
  (
    5, 5, 2, 1, 1,
    DATE_SUB(CURDATE(), INTERVAL 1 DAY), '16:00:00', '16:45:00', 50000.00,
    'dp_diterima', 'batal', NULL, 'Customer konfirmasi pembatalan karena ada keperluan mendadak. DP non-refundable tercatat untuk audit kas.'
  )
ON DUPLICATE KEY UPDATE
  `nominal_dp` = VALUES(`nominal_dp`),
  `status_pembayaran` = VALUES(`status_pembayaran`),
  `status_booking` = VALUES(`status_booking`),
  `catatan` = VALUES(`catatan`);
