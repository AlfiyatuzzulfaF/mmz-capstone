# Dokumentasi Arsitektur Sistem MMZ Booking Management

Dokumen arsitektur teknis lengkap untuk proyek ini dapat diakses pada:
👉 **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

### Ringkasan Cepat:
- **Tipe Sistem:** Web Application Dashboard Pemantauan Operasional & Transaksi (Admin & Owner)
- **Teknologi Utama:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TiDB Cloud Database, Google Calendar API v3, n8n Automation Engine.
- **Basis Spesifikasi:** [docs/prd.md](docs/prd.md) (KF-01 s.d. KF-13 & KNF-01 s.d. KNF-05).

Silakan baca [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) untuk detail lengkap mengenai:
1. Diagram Konteks C4 Level 1 & Level 2.
2. Skema ERD TiDB Cloud lengkap & Kamus Data Relasional.
3. Alur Sekuensial CRUD (Walk-in, Reschedule, Pelunasan, dan Soft Delete).
4. Penanganan Integritas Google Calendar & n8n WhatsApp Webhook.
5. Struktur Direktori Modular Next.js Clean Architecture.
