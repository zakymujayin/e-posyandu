# E-POSYANDU — DOKUMENTASI TEKNIS LENGKAP
**Sistem Tatakelola Posyandu & Pengaduan Masyarakat Online**
**Dinas Pemberdayaan Masyarakat dan Desa (DPMD) Kabupaten Lebak**

---

## DAFTAR ISI
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Hierarki Wilayah & Organisasi](#4-hierarki-wilayah--organisasi)
5. [User Roles & Permission Matrix](#5-user-roles--permission-matrix)
6. [Alur Bisnis (Business Logic)](#6-alur-bisnis-business-logic)
7. [Mekanisme SOP & Timer](#7-mekanisme-sop--timer)
8. [Status Flow Pengajuan](#8-status-flow-pengajuan)
9. [Sistem Nomor Tiket](#9-sistem-nomor-tiket)
10. [Sistem Form Dinamis](#10-sistem-form-dinamis)
11. [Spesifikasi Attachment & Media](#11-spesifikasi-attachment--media)
12. [Sistem Notifikasi](#12-sistem-notifikasi)
13. [Fitur Import CSV](#13-fitur-import-csv)
14. [Database Schema Lengkap](#14-database-schema-lengkap)
15. [API Routes (Next.js App Router)](#15-api-routes-nextjs-app-router)
16. [Panduan UI/UX](#16-panduan-uiux)
17. [Color Palette & Design System](#17-color-palette--design-system)
18. [Spesifikasi Halaman per Role](#18-spesifikasi-halaman-per-role)
19. [Halaman Publik — Tracking Tiket](#19-halaman-publik--tracking-tiket)
20. [Fitur Laporan & Analitik](#20-fitur-laporan--analitik)
21. [Manajemen Master Data (Admin DPMD)](#21-manajemen-master-data-admin-dpmd)
22. [Catatan Implementasi untuk AI Agent](#22-catatan-implementasi-untuk-ai-agent)

---

## 1. PROJECT OVERVIEW

### Deskripsi
E-Posyandu adalah sistem digital terpadu berbasis web yang memungkinkan:
1. **Kader Posyandu** menginput pengajuan layanan/pengaduan masyarakat secara digital
2. **Petugas Desa** memverifikasi pengajuan
3. **Petugas OPD** menindaklanjuti dan mengupload bukti penyelesaian
4. **Admin DPMD** mengawasi, memberikan teguran, melakukan bypass, dan meng-approve penyelesaian
5. **Masyarakat umum** melacak status pengajuan via nomor tiket di halaman publik

### Tagline
> *"Posyandu Maju, Layanan Prima, Masyarakat Sejahtera"*

### Target Pengguna Utama
Kader posyandu dan petugas desa yang **tidak familiar dengan IT** — sistem harus sangat mudah digunakan, informatif, dan mobile-friendly.

---

## 2. TECH STACK

| Komponen | Teknologi |
|----------|-----------|
| **Framework** | Next.js 14+ (App Router) |
| **Bahasa** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Auth** | NextAuth.js v5 (credentials provider) |
| **State Management** | Zustand + React Query (TanStack Query v5) |
| **UI Components** | shadcn/ui + Tailwind CSS v3 |
| **Form** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **File Upload** | UploadThing atau Cloudinary (PDF + Image) |
| **Scheduled Jobs** | Vercel Cron Jobs atau node-cron |
| **Email Notifikasi** | Nodemailer / Resend |
| **Deployment** | Vercel atau VPS (Docker) |

---

## 3. ARSITEKTUR SISTEM

```
┌─────────────────────────────────────────────────────┐
│                   NEXT.JS APP                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Pages /   │  │  API Routes │  │  Cron Jobs  │ │
│  │  Components │  │ (App Router)│  │ (SOP Timer) │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└────────────────────────┬────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │      PRISMA ORM     │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │     POSTGRESQL      │
              └─────────────────────┘
```

### Struktur Folder Next.js (App Router)
```
/app
  /(auth)
    /login
      page.tsx
  /(dashboard)
    /layout.tsx                  ← Layout dengan sidebar per role
    /kader/
      page.tsx                   ← Dashboard kader (6 card OPD)
      /ajukan/[opdId]/
        page.tsx                 ← Form pengajuan
      /riwayat/
        page.tsx                 ← Daftar pengajuan kader
    /petugas-desa/
      page.tsx                   ← Dashboard petugas desa
      /verifikasi/[id]/
        page.tsx                 ← Detail & aksi verifikasi
    /kecamatan/
      page.tsx                   ← Dashboard monitoring kecamatan
    /opd/
      page.tsx                   ← Dashboard OPD
      /tindak-lanjut/[id]/
        page.tsx                 ← Form tindak lanjut
    /admin/
      page.tsx                   ← Dashboard admin DPMD
      /pengajuan/[id]/
        page.tsx                 ← Detail pengajuan + aksi admin
      /laporan/
        page.tsx                 ← Laporan & analitik
      /master/
        /opd/page.tsx
        /layanan/page.tsx
        /form-fields/page.tsx
        /wilayah/page.tsx
        /users/page.tsx
  /tracking/
    page.tsx                     ← Halaman publik cek tiket
/components
  /ui/                           ← shadcn/ui components
  /shared/                       ← Komponen reusable
  /forms/                        ← Form components
/lib
  /prisma.ts                     ← Prisma client
  /auth.ts                       ← NextAuth config
  /sop.ts                        ← SOP & timer logic
  /ticket.ts                     ← Ticket number generator
  /working-days.ts               ← Hitung hari kerja
  /notifications.ts              ← Notification service
/prisma
  schema.prisma
```

---

## 4. HIERARKI WILAYAH & ORGANISASI

```
Kabupaten Lebak
└── Kecamatan (banyak)
    └── Desa (banyak per kecamatan)
        └── Posyandu (banyak per desa)
            └── Kader (banyak per posyandu)
```

### Aturan Penting
- 1 Kader hanya terikat ke **1 Posyandu**
- 1 Posyandu hanya ada di **1 Desa**
- 1 Petugas Desa terikat ke **1 Desa**
- 1 Petugas Kecamatan terikat ke **1 Kecamatan** (dapat melihat semua desa di kecamatannya)
- 1 Petugas OPD terikat ke **1 OPD**
- Admin DPMD tidak terikat wilayah — dapat melihat dan mengakses semua data

---

## 5. USER ROLES & PERMISSION MATRIX

### Daftar Role
| Role | Kode | Deskripsi |
|------|------|-----------|
| Kader Posyandu | `KADER` | Input pengajuan layanan/aduan masyarakat |
| Petugas Desa | `PETUGAS_DESA` | Verifikasi pengajuan |
| Petugas Kecamatan | `PETUGAS_KECAMATAN` | Monitor pengajuan (view only) |
| Petugas OPD | `PETUGAS_OPD` | Tindak lanjut + upload bukti |
| Admin DPMD | `ADMIN_DPMD` | Super user — kelola semua aspek sistem |

### Permission Matrix

| Fitur | KADER | PETUGAS_DESA | PETUGAS_KECAMATAN | PETUGAS_OPD | ADMIN_DPMD |
|-------|-------|--------------|-------------------|-------------|------------|
| Buat pengajuan baru | ✅ | ❌ | ❌ | ❌ | ❌ |
| Lihat pengajuan milik sendiri | ✅ | ✅ | ✅* | ✅* | ✅ |
| Verifikasi pengajuan | ❌ | ✅ | ❌ | ❌ | ❌ |
| Tolak pengajuan (desa) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Upload tindak lanjut | ❌ | ❌ | ❌ | ✅ | ❌ |
| Approve tindak lanjut OPD | ❌ | ❌ | ❌ | ❌ | ✅ |
| Kirim warning/teguran | ❌ | ❌ | ❌ | ❌ | ✅ |
| Bypass tahapan | ❌ | ❌ | ❌ | ❌ | ✅ |
| Kelola master OPD | ❌ | ❌ | ❌ | ❌ | ✅ |
| Kelola form fields | ❌ | ❌ | ❌ | ❌ | ✅ |
| Kelola user | ❌ | ❌ | ❌ | ❌ | ✅ |
| Import user CSV | ❌ | ❌ | ❌ | ❌ | ✅ |
| Lihat laporan/analitik | ❌ | ❌ | ❌ | ❌ | ✅ |

> *PETUGAS_KECAMATAN hanya melihat pengajuan dari desanya di kecamatan tersebut
> *PETUGAS_OPD hanya melihat pengajuan yang ditujukan ke OPD-nya

---

## 6. ALUR BISNIS (BUSINESS LOGIC)

### Alur Utama Pengajuan

```
[1] KADER INPUT PENGAJUAN
    ├─ Pilih OPD tujuan (dari 6 card)
    ├─ Pilih Jenis Layanan (dynamic)
    ├─ Isi form static (nama pelapor, NIK opsional, no HP opsional, alamat)
    ├─ Isi form dinamis (sesuai jenis layanan yang dipilih)
    ├─ Isi deskripsi/uraian (selalu ada)
    ├─ Upload file opsional (foto/PDF) atau link video opsional
    └─ Submit → Sistem generate nomor tiket → Status: MENUNGGU_VERIFIKASI

[2] PETUGAS DESA VERIFIKASI
    ├─ Lihat detail pengajuan dari posyandu di desanya
    ├─ APPROVE → Status: DALAM_PROSES_OPD → Pengajuan diteruskan ke OPD
    └─ REJECT → Status: DITOLAK → Case CLOSED (harus ajukan ulang)
         └─ Wajib mengisi alasan penolakan

[3] PETUGAS OPD TINDAK LANJUT
    ├─ Lihat pengajuan yang masuk ke OPD-nya
    ├─ TOLAK pengajuan (jika dinilai tidak sesuai tupoksi OPD)
    │   ├─ Wajib mengisi alasan penolakan
    │   └─ Status: DITOLAK_OPD → Case CLOSED (harus ajukan ulang)
    ├─ Upload bukti tindak lanjut (jika diterima):
    │   ├─ Deskripsi tindak lanjut (textarea, wajib)
    │   ├─ Upload file (PDF atau foto, opsional, bisa multiple)
    │   └─ Link video (TikTok/YouTube/lainnya, opsional, bisa multiple)
    └─ Submit → Status: MENUNGGU_APPROVAL_DPMD

[4] ADMIN DPMD REVIEW & APPROVE
    ├─ Review detail pengajuan + bukti dari OPD
    ├─ APPROVE → Status: SELESAI → Proses selesai
    └─ MINTA REVISI → Status: DALAM_PROSES_OPD (kembali ke OPD)
         └─ Wajib mengisi catatan revisi
```

### Aturan Penolakan
- Penolakan tahap desa hanya bisa dilakukan oleh **Petugas Desa** (pada tahap verifikasi)
- Penolakan tahap OPD hanya bisa dilakukan oleh **Petugas OPD** (pada tahap `DALAM_PROSES_OPD`)
- Alasan penolakan OPD: pengajuan dinilai tidak sesuai dengan tupoksi OPD tersebut
- Ketika ditolak (oleh desa maupun OPD): pengajuan **CLOSED permanen**
- Masyarakat harus **mengajukan ulang** jika ingin melanjutkan
- Kader yang membuat pengajuan mendapat notifikasi beserta alasan penolakan
- **Admin DPMD tidak bisa membatalkan penolakan** — jika ada keberatan, harus ajukan ulang

### Aturan Bypass oleh Admin DPMD
- Admin DPMD dapat melakukan bypass **setelah SOP 7 hari kerja habis**
- Bypass yang tersedia:
  - Jika stuck di **verifikasi desa** → bypass langsung ke tahap OPD (status: `DALAM_PROSES_OPD`)
  - Jika stuck di **tindak lanjut OPD** → bypass ke tahap approve (admin langsung close sebagai selesai)
- Setelah bypass, admin wajib mengisi catatan alasan bypass
- **Auto-bypass** oleh sistem: jika sudah **10 hari kalender** dari tanggal pengajuan dan belum ada tindakan, sistem otomatis membypass ke tahap berikutnya

---

## 7. MEKANISME SOP & TIMER

### Aturan SOP
- **Batas waktu total: 7 hari kerja** (Senin–Jumat, tidak termasuk hari libur nasional)
- Dihitung dari tanggal pengajuan disubmit oleh kader
- Berlaku untuk **keseluruhan proses** (bukan per tahapan)

### Tabel Hari Libur
Sistem menyimpan daftar hari libur nasional di tabel `public_holidays`. Admin DPMD dapat mengelola daftar ini. Fungsi `calculateWorkingDaysDeadline(startDate, workingDays)` tersedia di `/lib/working-days.ts`.

```typescript
// /lib/working-days.ts
export async function calculateDeadline(startDate: Date, workingDays: number): Promise<Date> {
  // Ambil semua hari libur dari database
  // Hitung hari kerja mulai dari startDate
  // Return deadline date
}

export async function getRemainingWorkingDays(startDate: Date, deadline: Date): Promise<number> {
  // Hitung sisa hari kerja antara sekarang dan deadline
}
```

### Alur Notifikasi SOP

```
Hari ke-1: Pengajuan disubmit
     ↓
[CRON JOB — berjalan setiap hari pukul 07:00]
     ↓
Cek semua pengajuan aktif (status != SELESAI, DITOLAK)
     ↓
┌─── Apakah H-2 sebelum deadline? ──────────────────────────────┐
│    YA → Kirim notifikasi ke:                                   │
│         - Admin DPMD                                           │
│         - User yang sedang handle (petugas desa/OPD)           │
│         Tandai field `notified_h2 = true`                      │
└────────────────────────────────────────────────────────────────┘
     ↓
┌─── Apakah SOP sudah habis (> 7 hari kerja)? ──────────────────┐
│    YA → Kirim notifikasi SOP EXPIRED ke Admin DPMD             │
│         Update status menjadi `MELEBIHI_SOP` (flag saja)       │
│         Admin DPMD dapat melakukan bypass manual               │
└────────────────────────────────────────────────────────────────┘
     ↓
┌─── Apakah sudah > 10 hari kalender dari submit? ──────────────┐
│    YA & belum bypass → AUTO BYPASS oleh sistem                 │
│         Log action: "AUTO_BYPASS oleh sistem"                  │
│         Kirim notifikasi ke semua pihak terkait                │
│         Lanjutkan ke tahap berikutnya                          │
└────────────────────────────────────────────────────────────────┘
```

### Definisi Auto-Bypass
- Dihitung **10 hari kalender** dari `submitted_at`
- Berlaku tanpa memandang apakah admin sudah kirim warning atau tidak
- Setelah auto-bypass: sistem mencatat di `activity_logs` dengan action `AUTO_BYPASS`
- Notifikasi dikirim ke: Admin DPMD, Kader yang submit, Petugas terkait

---

## 8. STATUS FLOW PENGAJUAN

### Daftar Status

| Status | Kode | Deskripsi |
|--------|------|-----------|
| Menunggu Verifikasi | `MENUNGGU_VERIFIKASI` | Baru disubmit kader, menunggu petugas desa |
| Dalam Proses OPD | `DALAM_PROSES_OPD` | Sudah diverifikasi desa, OPD harus tindak lanjut |
| Menunggu Approval | `MENUNGGU_APPROVAL_DPMD` | OPD sudah submit bukti, menunggu admin DPMD |
| Selesai | `SELESAI` | Admin DPMD sudah approve |
| Ditolak Desa | `DITOLAK_DESA` | Ditolak oleh petugas desa — CLOSED |
| Ditolak OPD | `DITOLAK_OPD` | Ditolak oleh petugas OPD (tidak sesuai tupoksi) — CLOSED |

### Diagram Transisi Status

```
[KADER SUBMIT]
      ↓
MENUNGGU_VERIFIKASI
      ├─── PETUGAS DESA APPROVE ──→ DALAM_PROSES_OPD
      ├─── PETUGAS DESA REJECT  ──→ DITOLAK_DESA (CLOSED)
      └─── ADMIN BYPASS         ──→ DALAM_PROSES_OPD

DALAM_PROSES_OPD
      ├─── OPD TOLAK            ──→ DITOLAK_OPD (CLOSED)
      ├─── OPD SUBMIT BUKTI     ──→ MENUNGGU_APPROVAL_DPMD
      └─── ADMIN BYPASS         ──→ SELESAI (admin close langsung)

MENUNGGU_APPROVAL_DPMD
      ├─── ADMIN APPROVE        ──→ SELESAI
      └─── ADMIN MINTA REVISI   ──→ DALAM_PROSES_OPD (OPD revisi ulang)
```

### Badge Warna Status (UI)
| Status | Warna Badge |
|--------|-------------|
| MENUNGGU_VERIFIKASI | 🟡 Kuning (warning) |
| DALAM_PROSES_OPD | 🔵 Biru (info) |
| MENUNGGU_APPROVAL_DPMD | 🟠 Oranye (pending) |
| SELESAI | 🟢 Hijau (success) |
| DITOLAK_DESA | 🔴 Merah (danger) |
| DITOLAK_OPD | 🔴 Merah tua (danger) |

---

## 9. SISTEM NOMOR TIKET

### Format Nomor Tiket
```
{PREFIX_OPD}/{TAHUN}/{NOMOR_URUT_5_DIGIT}

Contoh:
KES/2026/00001   → OPD Kesehatan, pengajuan ke-1 tahun 2026
PEND/2026/00042  → OPD Pendidikan, pengajuan ke-42 tahun 2026
PUPR/2026/00010  → OPD PUPR, pengajuan ke-10 tahun 2026
```

### Aturan Tiket
- Prefix OPD diatur oleh Admin DPMD di tabel `opds` (field: `tiket_prefix`)
- Nomor urut **per OPD per tahun** (reset ke 00001 setiap awal tahun)
- Setelah tiket digenerate, **tidak dapat diubah**
- Tabel `tiket_counters` digunakan untuk tracking sequence (dengan row-level locking untuk mencegah duplikasi)

### Fungsi Generator Tiket
```typescript
// /lib/ticket.ts
export async function generateTicketNumber(opdId: string): Promise<string> {
  // 1. Ambil OPD dari database (tiket_prefix, id)
  // 2. Ambil atau buat record di tiket_counters untuk opd+tahun
  // 3. Increment last_sequence dengan SELECT FOR UPDATE (atomic)
  // 4. Return format: "{PREFIX}/{YEAR}/{SEQUENCE.padStart(5,'0')}"
}
```

---

## 10. SISTEM FORM DINAMIS

### Konsep
Setiap OPD memiliki daftar **Jenis Layanan**. Setiap Jenis Layanan memiliki **template form fields** yang dikonfigurasi oleh Admin DPMD. Ketika kader memilih Jenis Layanan, form fields yang terkait muncul secara dinamis.

### Tipe Field yang Didukung

| Tipe | Kode | Deskripsi |
|------|------|-----------|
| Teks singkat | `text` | Input text biasa |
| Teks panjang | `textarea` | Multi-line text |
| Angka | `number` | Input numerik |
| Tanggal | `date` | Date picker |
| Pilihan tunggal | `select` | Dropdown pilihan |
| Pilihan radio | `radio` | Radio button |
| Pilihan ganda | `checkbox` | Checkbox multiple |

### Field Static (Selalu Muncul — Tidak Tergantung Jenis Layanan)

```
1. Nama Pelapor (text, WAJIB)
2. NIK Pelapor (text, TIDAK WAJIB, validasi 16 digit angka)
3. No. HP Pelapor (text, TIDAK WAJIB, validasi format nomor)
4. Alamat Pelapor (textarea, WAJIB)
5. Deskripsi/Uraian Pengaduan (textarea, WAJIB)
6. Upload Foto/Dokumen (file upload, TIDAK WAJIB, max 5 file)
7. Link Video (text input URL, TIDAK WAJIB, bisa tambah multiple)
```

### Field Dinamis (Muncul Berdasarkan Jenis Layanan)
- Diambil dari tabel `form_fields` berdasarkan `layanan_jenis_id` yang dipilih
- Diurutkan berdasarkan field `sort_order`
- Masing-masing field punya konfigurasi: `is_required`, `placeholder`, `helper_text`, `field_options` (untuk select/radio/checkbox)

### Struktur `field_options` (JSON)
```json
{
  "options": [
    { "value": "imunisasi_polio", "label": "Imunisasi Polio" },
    { "value": "imunisasi_bcg", "label": "Imunisasi BCG" },
    { "value": "imunisasi_dpt", "label": "Imunisasi DPT" }
  ]
}
```

### Penyimpanan Jawaban Form Dinamis
Jawaban form dinamis disimpan di tabel `pengajuan_field_values` menggunakan pola EAV (Entity-Attribute-Value):
- Semua value disimpan sebagai `String` di kolom `field_value`
- Untuk checkbox (multiple value): disimpan sebagai JSON array string, contoh: `["imunisasi_polio","imunisasi_bcg"]`
- Parse value saat ditampilkan berdasarkan `field_type` dari tabel `form_fields`

---

## 11. SPESIFIKASI ATTACHMENT & MEDIA

### Upload File (Kader & OPD)
| Parameter | Nilai |
|-----------|-------|
| Format diizinkan | JPG, JPEG, PNG, PDF |
| Ukuran maksimal per file | 5 MB |
| Jumlah file maksimal per pengajuan | 5 file |
| Storage | Cloudinary atau UploadThing (konfigurasi di env) |

### Link Video (Kader & OPD)
- Input: text field URL
- Platform yang dikenali: YouTube, TikTok, Instagram, Facebook, platform lain (simpan sebagai URL biasa)
- Validasi: harus berupa URL valid (starts with http:// atau https://)
- Jumlah link video: tidak dibatasi (bisa tambah baris)
- Cara menambah: tombol "+ Tambah Link Video" yang menghasilkan input baru
- Cara menghapus: tombol "×" di samping masing-masing input

### Tabel `pengajuan_attachments` (satu tabel untuk kader & OPD)
- Dibedakan dengan field `attachment_context`: `PENGAJUAN` (dari kader) atau `TINDAK_LANJUT` (dari OPD)
- Dibedakan dengan field `attachment_type`: `FILE` atau `VIDEO_LINK`

---

## 12. SISTEM NOTIFIKASI

### Jenis Notifikasi

| Tipe | Kode | Penerima | Trigger |
|------|------|----------|---------|
| Pengajuan baru | `NEW_SUBMISSION` | Petugas Desa | Kader submit pengajuan |
| Pengajuan diverifikasi | `VERIFIED` | Petugas OPD terkait | Petugas desa approve |
| Pengajuan ditolak desa | `REJECTED_DESA` | Kader | Petugas desa reject |
| Pengajuan ditolak OPD | `REJECTED_OPD` | Kader | Petugas OPD reject |
| Pengajuan masuk OPD | `OPD_RECEIVED` | Petugas OPD | Setelah verifikasi desa |
| Tindak lanjut disubmit | `FOLLOWUP_SUBMITTED` | Admin DPMD | OPD submit bukti |
| Tindak lanjut diapprove | `FOLLOWUP_APPROVED` | Petugas OPD, Kader | Admin approve |
| Diminta revisi | `REVISION_REQUESTED` | Petugas OPD | Admin minta revisi |
| Peringatan SOP H-2 | `SOP_WARNING_H2` | Admin DPMD + user terkait | H-2 sebelum deadline |
| SOP habis | `SOP_EXPIRED` | Admin DPMD | SOP 7 hari kerja habis |
| Teguran admin | `ADMIN_WARNING` | User terkait | Admin kirim teguran |
| Bypass manual | `BYPASS_MANUAL` | Semua pihak terkait | Admin lakukan bypass |
| Auto-bypass sistem | `AUTO_BYPASS` | Semua pihak terkait | Hari ke-10 auto-bypass |

### Cara Notifikasi
1. **In-app notification**: Bell icon di header, dropdown menampilkan notifikasi terbaru, badge angka unread
2. **Email**: Opsional (konfigurasi di env `ENABLE_EMAIL_NOTIFICATIONS=true`)

### Tabel Notifikasi
Notifikasi disimpan di tabel `notifications` per user. Saat user membuka dropdown, semua notifikasi yang belum dibaca ditandai `is_read = true`.

---

## 13. FITUR IMPORT CSV

### Siapa yang bisa import
Hanya **Admin DPMD**

### Apa yang bisa diimport
User dengan role: **Kader Posyandu, Petugas Desa, Petugas Kecamatan, Petugas OPD**

### Template CSV per Role

**Template Kader Posyandu** (`template_kader.csv`):
```csv
nama,email,password,posyandu_id
Siti Aminah,siti@example.com,password123,uuid-posyandu
Nia Rahayu,nia@example.com,password123,uuid-posyandu
```

**Template Petugas Desa** (`template_petugas_desa.csv`):
```csv
nama,email,password,desa_id
Ahmad Fauzi,ahmad@example.com,password123,uuid-desa
```

**Template Petugas Kecamatan** (`template_petugas_kecamatan.csv`):
```csv
nama,email,password,kecamatan_id
Budi Santoso,budi@example.com,password123,uuid-kecamatan
```

**Template Petugas OPD** (`template_petugas_opd.csv`):
```csv
nama,email,password,opd_id
Dewi Kusuma,dewi@example.com,password123,uuid-opd
```

### Proses Import
1. Admin download template CSV yang sesuai
2. Admin isi data di template
3. Admin upload CSV di halaman manajemen user
4. Sistem validasi setiap baris:
   - Email unik (tidak boleh duplikat di database maupun dalam file CSV)
   - ID referensi valid (posyandu_id / desa_id / kecamatan_id / opd_id harus ada di database)
   - Format email valid
5. Jika ada baris error: tampilkan **preview tabel** dengan highlight baris yang error + pesan error
6. Admin dapat memilih: import baris yang valid saja, atau perbaiki dulu
7. Password di-hash sebelum disimpan ke database
8. Setelah import: tampilkan summary (berhasil: X baris, gagal: Y baris)

---

## 14. DATABASE SCHEMA LENGKAP

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =============================================
// MASTER WILAYAH
// =============================================

model Kecamatan {
  id        String   @id @default(uuid())
  name      String
  code      String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  desas     Desa[]
  users     User[]

  @@map("kecamatans")
}

model Desa {
  id           String    @id @default(uuid())
  kecamatanId  String    @map("kecamatan_id")
  name         String
  code         String    @unique
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  kecamatan    Kecamatan  @relation(fields: [kecamatanId], references: [id])
  posyandus    Posyandu[]
  users        User[]
  pengajuans   Pengajuan[]

  @@map("desas")
}

model Posyandu {
  id        String   @id @default(uuid())
  desaId    String   @map("desa_id")
  name      String
  code      String   @unique
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  desa       Desa        @relation(fields: [desaId], references: [id])
  users      User[]
  pengajuans Pengajuan[]

  @@map("posyandus")
}

// =============================================
// OPD & LAYANAN
// =============================================

model Opd {
  id           String   @id @default(uuid())
  name         String
  code         String   @unique
  tiketPrefix  String   @unique @map("tiket_prefix")
  description  String?
  icon         String?                          // nama icon atau emoji
  color        String?                          // hex color untuk card UI, contoh: "#3B82F6"
  isActive     Boolean  @default(true) @map("is_active")
  sortOrder    Int      @default(0) @map("sort_order")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  layananjenis   LayananJenis[]
  users          User[]
  pengajuans     Pengajuan[]
  tiketCounters  TiketCounter[]

  @@map("opds")
}

model LayananJenis {
  id          String   @id @default(uuid())
  opdId       String   @map("opd_id")
  name        String                           // contoh: "Pengaduan", "Layanan Imunisasi"
  description String?
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  opd         Opd         @relation(fields: [opdId], references: [id])
  formFields  FormField[]
  pengajuans  Pengajuan[]

  @@map("layanan_jenis")
}

model FormField {
  id             String    @id @default(uuid())
  layananJenisId String    @map("layanan_jenis_id")
  fieldLabel     String    @map("field_label")               // label yang ditampilkan ke user
  fieldName      String    @map("field_name")                // snake_case, contoh: "nama_anak"
  fieldType      FieldType @map("field_type")
  fieldOptions   Json?     @map("field_options")             // untuk select/radio/checkbox
  isRequired     Boolean   @default(false) @map("is_required")
  placeholder    String?
  helperText     String?   @map("helper_text")               // teks bantuan di bawah input
  sortOrder      Int       @default(0) @map("sort_order")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  layananJenis       LayananJenis         @relation(fields: [layananJenisId], references: [id])
  pengajuanFieldValues PengajuanFieldValue[]

  @@map("form_fields")
}

enum FieldType {
  text
  textarea
  number
  date
  select
  radio
  checkbox
}

// =============================================
// USERS
// =============================================

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  password     String                          // bcrypt hashed
  role         UserRole
  posyanduId   String?  @map("posyandu_id")   // untuk KADER
  desaId       String?  @map("desa_id")       // untuk PETUGAS_DESA
  kecamatanId  String?  @map("kecamatan_id")  // untuk PETUGAS_KECAMATAN
  opdId        String?  @map("opd_id")        // untuk PETUGAS_OPD
  phone        String?
  isActive     Boolean  @default(true) @map("is_active")
  lastLoginAt  DateTime? @map("last_login_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  posyandu     Posyandu?  @relation(fields: [posyanduId], references: [id])
  desa         Desa?      @relation(fields: [desaId], references: [id])
  kecamatan    Kecamatan? @relation(fields: [kecamatanId], references: [id])
  opd          Opd?       @relation(fields: [opdId], references: [id])

  pengajuansAsKader    Pengajuan[]   @relation("KaderPengajuan")
  verifikasiDesas      VerifikasiDesa[]
  tindakLanjuts        TindakLanjut[]
  adminActions         AdminAction[]
  notifications        Notification[]

  @@map("users")
}

enum UserRole {
  KADER
  PETUGAS_DESA
  PETUGAS_KECAMATAN
  PETUGAS_OPD
  ADMIN_DPMD
}

// =============================================
// TIKET COUNTER
// =============================================

model TiketCounter {
  id           String @id @default(uuid())
  opdId        String @map("opd_id")
  year         Int
  lastSequence Int    @default(0) @map("last_sequence")

  opd          Opd @relation(fields: [opdId], references: [id])

  @@unique([opdId, year])
  @@map("tiket_counters")
}

// =============================================
// PENGAJUAN (MAIN TABLE)
// =============================================

model Pengajuan {
  id              String          @id @default(uuid())
  tiketNumber     String          @unique @map("tiket_number")
  kaderId         String          @map("kader_id")
  posyanduId      String          @map("posyandu_id")
  desaId          String          @map("desa_id")
  opdId           String          @map("opd_id")
  layananJenisId  String          @map("layanan_jenis_id")

  // Data pelapor (static fields)
  namaPelapor     String          @map("nama_pelapor")
  nikPelapor      String?         @map("nik_pelapor")
  noHpPelapor     String?         @map("no_hp_pelapor")
  alamatPelapor   String          @map("alamat_pelapor")
  deskripsi       String

  // Status & SOP
  status          PengajuanStatus @default(MENUNGGU_VERIFIKASI)
  submittedAt     DateTime        @default(now()) @map("submitted_at")
  deadlineAt      DateTime        @map("deadline_at")               // submittedAt + 7 hari kerja
  notifiedH2      Boolean         @default(false) @map("notified_h2")
  sopExpiredAt    DateTime?       @map("sop_expired_at")            // waktu SOP dinyatakan habis
  autoBypassAt    DateTime?       @map("auto_bypass_at")            // waktu auto-bypass terjadi
  completedAt     DateTime?       @map("completed_at")

  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  // Relations
  kader           User             @relation("KaderPengajuan", fields: [kaderId], references: [id])
  posyandu        Posyandu         @relation(fields: [posyanduId], references: [id])
  desa            Desa             @relation(fields: [desaId], references: [id])
  opd             Opd              @relation(fields: [opdId], references: [id])
  layananJenis    LayananJenis     @relation(fields: [layananJenisId], references: [id])

  fieldValues     PengajuanFieldValue[]
  attachments     PengajuanAttachment[]
  verifikasiDesa  VerifikasiDesa?
  tindakLanjuts   TindakLanjut[]
  adminActions    AdminAction[]
  activityLogs    ActivityLog[]
  notifications   Notification[]

  @@map("pengajuans")
}

enum PengajuanStatus {
  MENUNGGU_VERIFIKASI
  DALAM_PROSES_OPD
  MENUNGGU_APPROVAL_DPMD
  SELESAI
  DITOLAK_DESA      // ditolak petugas desa — CLOSED
  DITOLAK_OPD       // ditolak petugas OPD (tidak sesuai tupoksi) — CLOSED
}

// =============================================
// DYNAMIC FORM VALUES
// =============================================

model PengajuanFieldValue {
  id           String @id @default(uuid())
  pengajuanId  String @map("pengajuan_id")
  formFieldId  String @map("form_field_id")
  fieldValue   String @map("field_value")      // semua disimpan sebagai string; checkbox: JSON array string

  pengajuan    Pengajuan @relation(fields: [pengajuanId], references: [id], onDelete: Cascade)
  formField    FormField @relation(fields: [formFieldId], references: [id])

  @@map("pengajuan_field_values")
}

// =============================================
// ATTACHMENTS (FILE & VIDEO LINK)
// =============================================

model PengajuanAttachment {
  id                 String            @id @default(uuid())
  pengajuanId        String            @map("pengajuan_id")
  uploadedById       String            @map("uploaded_by_id")
  attachmentContext  AttachmentContext  @map("attachment_context")  // PENGAJUAN atau TINDAK_LANJUT
  attachmentType     AttachmentType    @map("attachment_type")      // FILE atau VIDEO_LINK
  tindakLanjutId     String?           @map("tindak_lanjut_id")     // jika context TINDAK_LANJUT

  // Untuk FILE
  filePath   String?  @map("file_path")
  fileName   String?  @map("file_name")
  fileSize   Int?     @map("file_size")        // dalam bytes
  mimeType   String?  @map("mime_type")

  // Untuk VIDEO_LINK
  videoUrl      String?  @map("video_url")
  videoPlatform String?  @map("video_platform") // youtube, tiktok, instagram, facebook, other

  createdAt    DateTime @default(now()) @map("created_at")

  pengajuan    Pengajuan    @relation(fields: [pengajuanId], references: [id], onDelete: Cascade)
  tindakLanjut TindakLanjut? @relation(fields: [tindakLanjutId], references: [id])

  @@map("pengajuan_attachments")
}

enum AttachmentContext {
  PENGAJUAN
  TINDAK_LANJUT
}

enum AttachmentType {
  FILE
  VIDEO_LINK
}

// =============================================
// VERIFIKASI DESA
// =============================================

model VerifikasiDesa {
  id             String              @id @default(uuid())
  pengajuanId    String              @unique @map("pengajuan_id")
  petugasDesaId  String              @map("petugas_desa_id")
  status         VerifikasiStatus
  catatan        String?             // wajib diisi jika status REJECTED
  verifiedAt     DateTime            @default(now()) @map("verified_at")
  createdAt      DateTime            @default(now()) @map("created_at")

  pengajuan      Pengajuan @relation(fields: [pengajuanId], references: [id])
  petugasDesa    User      @relation(fields: [petugasDesaId], references: [id])

  @@map("verifikasi_desas")
}

enum VerifikasiStatus {
  APPROVED
  REJECTED
}

// =============================================
// TINDAK LANJUT OPD
// =============================================

model TindakLanjut {
  id            String              @id @default(uuid())
  pengajuanId   String              @map("pengajuan_id")
  petugasOpdId  String              @map("petugas_opd_id")
  deskripsi     String
  status        TindakLanjutStatus  @default(SUBMITTED)
  submittedAt   DateTime            @default(now()) @map("submitted_at")
  createdAt     DateTime            @default(now()) @map("created_at")
  updatedAt     DateTime            @updatedAt @map("updated_at")

  pengajuan     Pengajuan               @relation(fields: [pengajuanId], references: [id])
  petugasOpd    User                    @relation(fields: [petugasOpdId], references: [id])
  attachments   PengajuanAttachment[]

  @@map("tindak_lanjuts")
}

enum TindakLanjutStatus {
  SUBMITTED          // baru disubmit OPD, menunggu admin DPMD
  APPROVED           // diapprove admin DPMD
  REVISION_NEEDED    // admin minta revisi
}

// =============================================
// ADMIN ACTIONS
// =============================================

model AdminAction {
  id           String      @id @default(uuid())
  pengajuanId  String      @map("pengajuan_id")
  adminId      String      @map("admin_id")
  actionType   ActionType  @map("action_type")
  targetRole   String?     @map("target_role")       // role yang dituju: PETUGAS_DESA, PETUGAS_OPD
  targetUserId String?     @map("target_user_id")
  catatan      String
  createdAt    DateTime    @default(now()) @map("created_at")

  pengajuan    Pengajuan  @relation(fields: [pengajuanId], references: [id])
  admin        User       @relation(fields: [adminId], references: [id])

  @@map("admin_actions")
}

enum ActionType {
  WARNING          // teguran ke user terkait
  BYPASS_MANUAL    // bypass manual oleh admin
  AUTO_BYPASS      // bypass otomatis oleh sistem
  APPROVE          // approve tindak lanjut OPD
  REVISION_REQUEST // minta revisi ke OPD
}

// =============================================
// NOTIFICATIONS
// =============================================

model Notification {
  id           String           @id @default(uuid())
  userId       String           @map("user_id")
  pengajuanId  String?          @map("pengajuan_id")
  type         NotificationType
  title        String
  message      String
  isRead       Boolean          @default(false) @map("is_read")
  readAt       DateTime?        @map("read_at")
  createdAt    DateTime         @default(now()) @map("created_at")

  user         User       @relation(fields: [userId], references: [id])
  pengajuan    Pengajuan? @relation(fields: [pengajuanId], references: [id])

  @@map("notifications")
}

enum NotificationType {
  NEW_SUBMISSION
  VERIFIED
  REJECTED_DESA
  REJECTED_OPD
  OPD_RECEIVED
  FOLLOWUP_SUBMITTED
  FOLLOWUP_APPROVED
  REVISION_REQUESTED
  SOP_WARNING_H2
  SOP_EXPIRED
  ADMIN_WARNING
  BYPASS_MANUAL
  AUTO_BYPASS
}

// =============================================
// ACTIVITY LOGS (AUDIT TRAIL)
// =============================================

model ActivityLog {
  id           String   @id @default(uuid())
  pengajuanId  String   @map("pengajuan_id")
  userId       String?  @map("user_id")       // null jika aksi sistem (auto-bypass)
  userRole     String?  @map("user_role")
  action       String                          // deskripsi aksi, contoh: "Pengajuan diverifikasi"
  oldStatus    String?  @map("old_status")
  newStatus    String?  @map("new_status")
  catatan      String?
  createdAt    DateTime @default(now()) @map("created_at")

  pengajuan    Pengajuan @relation(fields: [pengajuanId], references: [id])

  @@map("activity_logs")
}

// =============================================
// HARI LIBUR NASIONAL
// =============================================

model PublicHoliday {
  id        String   @id @default(uuid())
  date      DateTime @unique
  name      String
  createdAt DateTime @default(now()) @map("created_at")

  @@map("public_holidays")
}
```

---

## 15. API ROUTES (NEXT.JS APP ROUTER)

### Konvensi
- Semua route ada di `/app/api/`
- Auth check dilakukan di setiap route handler menggunakan `getServerSession(authOptions)`
- Role check menggunakan middleware atau helper `requireRole(session, ['KADER'])`
- Response format standar:
```json
{
  "success": true,
  "data": { ... },
  "message": "Pesan sukses"
}
```
atau jika error:
```json
{
  "success": false,
  "error": "Pesan error",
  "details": { ... }
}
```

### Daftar API Routes

#### Authentication
```
POST   /api/auth/[...nextauth]    → NextAuth handler
POST   /api/auth/logout           → Logout
```

#### Pengajuan
```
GET    /api/pengajuan             → List pengajuan (filter by role otomatis)
POST   /api/pengajuan             → Buat pengajuan baru (KADER only)
GET    /api/pengajuan/:id         → Detail pengajuan
PATCH  /api/pengajuan/:id/verifikasi   → Verifikasi desa (PETUGAS_DESA only)
POST   /api/pengajuan/:id/tindak-lanjut → Submit tindak lanjut (PETUGAS_OPD only)
POST   /api/pengajuan/:id/tolak-opd    → Tolak pengajuan oleh OPD (PETUGAS_OPD only)
POST   /api/pengajuan/:id/approve      → Approve tindak lanjut (ADMIN_DPMD only)
POST   /api/pengajuan/:id/revisi       → Minta revisi (ADMIN_DPMD only)
POST   /api/pengajuan/:id/warning      → Kirim teguran (ADMIN_DPMD only)
POST   /api/pengajuan/:id/bypass       → Bypass manual (ADMIN_DPMD only)
```

#### Public Tracking
```
GET    /api/tracking/:tiketNumber → Info publik pengajuan (no auth)
```

#### OPD Master
```
GET    /api/opd                   → List semua OPD aktif
POST   /api/opd                   → Buat OPD baru (ADMIN_DPMD only)
PATCH  /api/opd/:id               → Edit OPD (ADMIN_DPMD only)
DELETE /api/opd/:id               → Nonaktifkan OPD (ADMIN_DPMD only, soft delete via isActive)
```

#### Layanan Jenis
```
GET    /api/opd/:opdId/layanan          → List jenis layanan per OPD
POST   /api/opd/:opdId/layanan          → Tambah jenis layanan (ADMIN_DPMD only)
PATCH  /api/opd/:opdId/layanan/:id      → Edit jenis layanan (ADMIN_DPMD only)
GET    /api/opd/:opdId/layanan/:id/fields → Ambil form fields (untuk render form dinamis)
```

#### Form Fields
```
GET    /api/layanan/:layananId/fields   → List form fields
POST   /api/layanan/:layananId/fields   → Tambah field (ADMIN_DPMD only)
PATCH  /api/layanan/:layananId/fields/:id → Edit field (ADMIN_DPMD only)
DELETE /api/layanan/:layananId/fields/:id → Hapus field (ADMIN_DPMD only)
```

#### User Management
```
GET    /api/users                 → List users (ADMIN_DPMD only)
POST   /api/users                 → Buat user baru (ADMIN_DPMD only)
PATCH  /api/users/:id             → Edit user (ADMIN_DPMD only)
DELETE /api/users/:id             → Nonaktifkan user (ADMIN_DPMD only, soft delete)
POST   /api/users/import          → Import user dari CSV (ADMIN_DPMD only)
GET    /api/users/template/:role  → Download template CSV
```

#### Notifikasi
```
GET    /api/notifications         → List notifikasi user yang login
PATCH  /api/notifications/read-all → Tandai semua sudah dibaca
```

#### Laporan (ADMIN_DPMD only)
```
GET    /api/laporan/summary       → Ringkasan total semua OPD
GET    /api/laporan/opd/:opdId    → Laporan per OPD
GET    /api/laporan/export        → Export laporan ke PDF/Excel
```

#### Wilayah Master
```
GET    /api/wilayah/kecamatan     → List kecamatan
POST   /api/wilayah/kecamatan     → Tambah kecamatan
GET    /api/wilayah/kecamatan/:id/desa → List desa di kecamatan
POST   /api/wilayah/desa          → Tambah desa
GET    /api/wilayah/desa/:id/posyandu → List posyandu di desa
POST   /api/wilayah/posyandu      → Tambah posyandu
```

#### Cron Job (Internal — dipanggil oleh Vercel Cron / scheduler)
```
POST   /api/cron/sop-check        → Cek SOP harian (protected by CRON_SECRET)
```

---

## 16. PANDUAN UI/UX

### Prinsip Utama
1. **Bahasa Indonesia** di seluruh UI — tidak ada teks Bahasa Inggris yang terlihat user
2. **Mobile-first** — desain dimulai dari tampilan mobile (320px+), baru desktop
3. **Tombol besar** — min-height 44px untuk semua tombol (touch-friendly)
4. **Label + icon** — tidak pernah icon saja tanpa teks label
5. **Konfirmasi sebelum aksi penting** — modal konfirmasi untuk: verifikasi, penolakan, bypass, approve
6. **Feedback langsung** — loading state, success toast, error toast setelah setiap aksi
7. **Informasi status jelas** — badge warna + teks status di setiap pengajuan
8. **Helper text** — setiap form field punya placeholder dan keterangan tambahan jika dibutuhkan
9. **Empty state** — tampilkan pesan + ilustrasi ketika tidak ada data
10. **Error handling** — pesan error yang ramah pengguna (bukan kode teknis)

### Responsive Breakpoints
```css
Mobile  : < 768px   (default — mobile first)
Tablet  : 768px+
Desktop : 1024px+
Wide    : 1280px+
```

### Navigasi
- **Mobile**: Bottom navigation bar (ikon + label) untuk halaman utama + hamburger menu
- **Desktop**: Sidebar kiri yang bisa collapse + header dengan info user & notifikasi

### Loading States
- Gunakan skeleton loading (bukan spinner) untuk list data
- Gunakan spinner di dalam tombol saat submit form
- Disable tombol saat proses berlangsung untuk mencegah double submit

### Toast Notification
- Sukses: warna hijau, icon centang, muncul 3 detik
- Error: warna merah, icon x, muncul 5 detik (lebih lama karena perlu dibaca)
- Warning: warna kuning, icon peringatan

---

## 17. COLOR PALETTE & DESIGN SYSTEM

### Warna Utama

```css
/* Primary — Biru Pemerintah */
--color-primary-50:  #EFF6FF;
--color-primary-100: #DBEAFE;
--color-primary-500: #3B82F6;
--color-primary-600: #2563EB;  /* default button */
--color-primary-700: #1D4ED8;  /* hover */
--color-primary-800: #1E40AF;  /* dark */

/* Secondary — Hijau Kesehatan/Komunitas */
--color-secondary-50:  #F0FDF4;
--color-secondary-500: #22C55E;
--color-secondary-600: #16A34A;
--color-secondary-700: #15803D;

/* Neutral — Abu-abu */
--color-gray-50:  #F8FAFC;   /* background halaman */
--color-gray-100: #F1F5F9;   /* background card */
--color-gray-200: #E2E8F0;   /* border */
--color-gray-500: #64748B;   /* teks sekunder */
--color-gray-700: #334155;   /* teks body */
--color-gray-900: #0F172A;   /* teks heading */

/* Status */
--color-success: #16A34A;    /* hijau */
--color-warning: #D97706;    /* amber */
--color-danger:  #DC2626;    /* merah */
--color-info:    #2563EB;    /* biru */

/* Pending/Waiting */
--color-pending: #9333EA;    /* ungu */
```

### Warna Card OPD (Default — bisa diubah admin)
| OPD | Warna | Hex |
|-----|-------|-----|
| Pendidikan | Biru | `#3B82F6` |
| Kesehatan | Hijau emerald | `#10B981` |
| PUPR | Oranye | `#F97316` |
| Perumahan Rakyat | Ungu | `#8B5CF6` |
| Satpol PP | Merah | `#EF4444` |
| Sosial | Pink | `#EC4899` |

### Typography
```css
Font Family : Inter atau system-ui
Heading 1   : 24px, font-weight: 700
Heading 2   : 20px, font-weight: 600
Heading 3   : 16px, font-weight: 600
Body        : 14px, font-weight: 400
Small       : 12px, font-weight: 400
Label form  : 14px, font-weight: 500
```

### Komponen UI Standar

#### Button
```
Primary   : bg-blue-600 text-white hover:bg-blue-700
Secondary : bg-gray-100 text-gray-700 hover:bg-gray-200
Danger    : bg-red-600 text-white hover:bg-red-700
Success   : bg-green-600 text-white hover:bg-green-700
Size      : min-h-[44px] px-4 rounded-lg font-medium
```

#### Badge Status
```
MENUNGGU_VERIFIKASI    : bg-yellow-100 text-yellow-800
DALAM_PROSES_OPD       : bg-blue-100 text-blue-800
MENUNGGU_APPROVAL_DPMD : bg-orange-100 text-orange-800
SELESAI                : bg-green-100 text-green-800
DITOLAK                : bg-red-100 text-red-800
```

#### Card
```
bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6
```

---

## 18. SPESIFIKASI HALAMAN PER ROLE

---

### A. HALAMAN LOGIN (Semua Role)

**URL**: `/login`

**Elemen**:
- Logo E-Posyandu + nama Dinas DPMD Kabupaten Lebak
- Judul: "Masuk ke Sistem E-Posyandu"
- Form: Email, Password (dengan toggle show/hide)
- Tombol "Masuk" (lebar penuh)
- Tidak ada link registrasi (user dibuat oleh admin)

**Behavior**:
- Setelah login berhasil → redirect ke dashboard sesuai role
- Jika login gagal → tampilkan pesan: "Email atau kata sandi salah"
- Max 5 kali gagal login → tampilkan pesan "Terlalu banyak percobaan, coba lagi dalam 15 menit"

---

### B. DASHBOARD KADER POSYANDU

**URL**: `/kader`

**Layout**: Header (nama + posyandu) + ringkasan statistik + 6 card OPD + daftar pengajuan terbaru

**Elemen**:
1. **Header Info**:
   - "Selamat datang, [Nama Kader]"
   - "Posyandu: [Nama Posyandu] — [Nama Desa]"

2. **Ringkasan Statistik** (4 kartu kecil):
   - Total Pengajuan (semua yang pernah dibuat kader ini)
   - Dalam Proses
   - Selesai
   - Ditolak

3. **Section: "Buat Pengajuan Baru"**:
   - Teks panduan: "Pilih OPD yang sesuai dengan jenis layanan atau pengaduan masyarakat:"
   - 6 card OPD (grid 2 kolom di mobile, 3 kolom di tablet, 6 di desktop)
   - Setiap card OPD berisi: icon, nama OPD, deskripsi singkat, warna sesuai OPD
   - Card yang tidak aktif (`is_active = false`) tidak ditampilkan
   - Card diurutkan berdasarkan `sort_order`

4. **Section: "Pengajuan Terbaru"**:
   - Tabel/list 5 pengajuan terakhir dari kader ini
   - Kolom: No. Tiket, Nama Pelapor, OPD, Status (badge), Tanggal
   - Link "Lihat Semua Pengajuan" → `/kader/riwayat`

---

### C. HALAMAN FORM PENGAJUAN (KADER)

**URL**: `/kader/ajukan/[opdId]`

**Judul**: "Pengajuan ke [Nama OPD]"

**Struktur Form** (urutan dari atas ke bawah):

**Bagian 1 — Pilih Jenis Layanan**:
- Dropdown/select: "Pilih Jenis Layanan" (required)
- Setelah dipilih → form dinamis muncul di bawahnya
- Jika belum pilih → form dinamis tidak muncul

**Bagian 2 — Form Dinamis** (muncul setelah pilih jenis layanan):
- Render fields dari database sesuai `layanan_jenis_id` yang dipilih
- Urutan berdasarkan `sort_order`
- Label + input sesuai tipe field
- Field wajib ditandai dengan asterisk merah (*)
- Helper text ditampilkan di bawah input (warna abu-abu, ukuran kecil)

**Bagian 3 — Data Pelapor** (static, selalu muncul):
```
- Nama Pelapor *         (text input, required)
- NIK Pelapor            (text input, optional, max 16 digit, hanya angka)
- No. HP Pelapor         (text input, optional, format nomor Indonesia)
- Alamat Pelapor *       (textarea, required)
```

**Bagian 4 — Deskripsi** (static, selalu muncul):
```
- Deskripsi / Uraian Pengaduan *  (textarea, required, min 20 karakter)
  Helper text: "Jelaskan secara detail permasalahan atau layanan yang dibutuhkan"
```

**Bagian 5 — Lampiran** (static, selalu muncul, opsional semua):
```
- Upload Foto / Dokumen
  Keterangan: "Format: JPG, PNG, PDF. Maks 5 MB per file. Maks 5 file."
  Tampilkan preview thumbnail setelah upload
  
- Link Video (opsional)
  Input URL dengan tombol "+ Tambah Link Video"
  Setiap baris: [input URL] [tombol hapus]
  Keterangan: "Tempel link video dari YouTube, TikTok, atau platform lain"
```

**Tombol**:
- "Batal" (secondary) → kembali ke dashboard
- "Kirim Pengajuan" (primary, full width) → konfirmasi modal terlebih dahulu

**Modal Konfirmasi Kirim**:
```
Judul: "Konfirmasi Pengajuan"
Isi  : "Apakah data yang Anda masukkan sudah benar? 
       Pengajuan yang sudah dikirim tidak dapat diedit."
Tombol: [Batal] [Ya, Kirim Sekarang]
```

**Setelah Submit Berhasil**:
- Redirect ke halaman sukses
- Tampilkan nomor tiket yang dihasilkan dalam kotak besar
- Tombol "Salin Nomor Tiket"
- Keterangan: "Berikan nomor tiket ini kepada masyarakat untuk melacak status pengajuan"
- Tombol "Kembali ke Beranda"

---

### D. HALAMAN RIWAYAT PENGAJUAN (KADER)

**URL**: `/kader/riwayat`

**Elemen**:
- Filter: Status (semua/menunggu/proses/selesai/ditolak), OPD, Tanggal dari-sampai
- Tabel pengajuan dengan kolom: No. Tiket, Nama Pelapor, Jenis Layanan, OPD, Status, Tanggal Submit
- Klik baris → halaman detail pengajuan (view only untuk kader)
- Pagination (10 per halaman)
- Export CSV (opsional)

---

### E. DASHBOARD PETUGAS DESA

**URL**: `/petugas-desa`

**Elemen**:
1. **Ringkasan**:
   - Menunggu verifikasi saya: [angka] (badge merah jika > 0)
   - Total sudah diverifikasi: [angka]
   - Total ditolak: [angka]

2. **Tab**:
   - Tab "Perlu Diverifikasi" (default) — list pengajuan status MENUNGGU_VERIFIKASI dari desa ini
   - Tab "Sudah Diproses" — list semua pengajuan yang sudah diverifikasi/ditolak

3. **List Pengajuan**:
   - Tampilkan: No. Tiket, Nama Pelapor, OPD, Jenis Layanan, Tanggal Submit, Status SOP (normal/hampir habis/habis)
   - Indikator SOP: ikon jam jika H-2 (warna kuning), ikon peringatan jika habis (warna merah)
   - Klik → halaman detail + verifikasi

---

### F. HALAMAN DETAIL & VERIFIKASI (PETUGAS DESA)

**URL**: `/petugas-desa/verifikasi/[id]`

**Elemen**:
1. **Info Pengajuan**:
   - No. tiket, OPD tujuan, jenis layanan
   - Status saat ini + badge
   - Informasi SOP (deadline, sisa hari kerja)

2. **Data Pelapor**: nama, NIK, no HP, alamat

3. **Detail Layanan** (dynamic fields): tampilkan label + nilai yang diisi kader

4. **Deskripsi**: isi deskripsi dari kader

5. **Lampiran dari Kader**: preview foto/PDF + link video (jika ada)

6. **Timeline Aktivitas**: urutan kronologis semua aksi yang sudah terjadi

7. **Aksi Verifikasi** (hanya muncul jika status MENUNGGU_VERIFIKASI):
   - Tombol "✅ Verifikasi & Teruskan ke OPD" (primary/hijau)
   - Tombol "❌ Tolak Pengajuan" (danger/merah)
   - Klik Tolak → modal dengan textarea "Alasan Penolakan" (wajib diisi)
   - Klik Verifikasi → modal konfirmasi

---

### G. DASHBOARD PETUGAS KECAMATAN

**URL**: `/kecamatan`

**Elemen**:
- Header: nama, kecamatan
- Summary card: Total pengajuan, Dalam proses, Selesai, Ditolak (dari semua desa di kecamatan ini)
- Filter: Desa, OPD, Status, Tanggal
- Tabel semua pengajuan dari kecamatan ini (view only — tidak ada tombol aksi)
- Klik baris → halaman detail (view only)

**Penting**: Tidak ada tombol aksi apapun. Hanya bisa melihat.

---

### H. DASHBOARD PETUGAS OPD

**URL**: `/opd`

**Elemen**:
1. **Header**: nama, OPD
2. **Ringkasan**: Perlu ditindaklanjuti / Menunggu approval DPMD / Selesai / Ditolak
3. **Tab**:
   - "Perlu Ditindaklanjuti" — status DALAM_PROSES_OPD
   - "Sudah Disubmit" — status MENUNGGU_APPROVAL_DPMD
   - "Selesai" — status SELESAI
4. **List Pengajuan OPD**:
   - Indikator SOP mirip petugas desa
   - Klik → halaman tindak lanjut

---

### I. HALAMAN TINDAK LANJUT (PETUGAS OPD)

**URL**: `/opd/tindak-lanjut/[id]`

**Elemen**:
1. **Info Pengajuan lengkap** (sama seperti halaman detail petugas desa)
2. **Riwayat Tindak Lanjut** sebelumnya jika pernah ada revisi
3. **Form Tindak Lanjut** (hanya muncul jika status DALAM_PROSES_OPD):
   ```
   - Deskripsi Tindak Lanjut * (textarea, required)
     Placeholder: "Jelaskan langkah-langkah yang telah dilakukan..."
   - Upload Bukti (foto/PDF, opsional, max 5 file, max 5MB)
   - Link Video Bukti (opsional, bisa multiple)
   - Tombol "Kirim Tindak Lanjut" (primary/hijau) → konfirmasi modal
   - Tombol "Tolak Pengajuan" (danger/merah) → modal alasan penolakan (wajib diisi)
   ```
   **Keterangan untuk tombol tolak**: "Tolak jika pengajuan ini tidak sesuai dengan tupoksi OPD Anda. Pengajuan akan ditutup dan masyarakat harus mengajukan ulang."
4. **Status MENUNGGU_APPROVAL_DPMD**: tampilkan pesan "Tindak lanjut Anda sedang direview oleh Admin DPMD"
5. **Status REVISION_NEEDED**: tampilkan catatan revisi dari admin + form tindak lanjut terbuka kembali

---

### J. DASHBOARD ADMIN DPMD

**URL**: `/admin`

**Elemen**:
1. **Header**: "Dashboard Admin DPMD"
2. **Summary Cards** (besar, 4-6 kartu):
   - Total Semua Pengajuan
   - Menunggu Verifikasi
   - Dalam Proses OPD
   - Menunggu Approval Saya
   - Selesai
   - Ditolak
3. **Alert Section** — pengajuan yang perlu perhatian:
   - Pengajuan H-2 atau SOP habis (highlight merah/kuning)
   - Pengajuan yang butuh di-approve (menunggu DPMD)
4. **Tabel Semua Pengajuan** dengan filter lengkap:
   - Filter: OPD, Desa, Kecamatan, Status, Tanggal, SOP status
   - Klik → halaman detail admin
5. **Quick Links**: Laporan, Master Data, Kelola User

---

### K. HALAMAN DETAIL PENGAJUAN (ADMIN DPMD)

**URL**: `/admin/pengajuan/[id]`

**Elemen**:
1. **Info Pengajuan lengkap** + info SOP (progress bar sisa waktu)
2. **Data Pelapor** + Dynamic Fields + Deskripsi
3. **Lampiran dari Kader**
4. **Detail Tindak Lanjut OPD** (jika sudah ada): deskripsi + bukti
5. **Timeline Aktivitas Lengkap**
6. **Panel Aksi Admin** (di sisi kanan pada desktop, di bawah pada mobile):

   **Jika status MENUNGGU_VERIFIKASI atau DALAM_PROSES_OPD** (setelah SOP habis):
   ```
   [📢 Kirim Teguran] → modal textarea wajib diisi
   [⚡ Bypass ke OPD] → modal konfirmasi + catatan wajib (muncul jika SOP habis)
   ```

   **Jika status MENUNGGU_APPROVAL_DPMD**:
   ```
   [✅ Approve & Selesaikan]  → modal konfirmasi
   [🔄 Minta Revisi ke OPD]  → modal textarea catatan wajib
   ```

   **Semua status**: Tampilkan daftar teguran/warning yang sudah pernah dikirim

---

## 19. HALAMAN PUBLIK — TRACKING TIKET

**URL**: `/tracking`

**Tidak memerlukan login**

**Elemen**:
1. Header sederhana: logo + nama sistem
2. Judul: "Lacak Status Pengajuan"
3. Keterangan: "Masukkan nomor tiket yang diberikan oleh kader posyandu"
4. Form: input nomor tiket + tombol "Cek Status"
5. Contoh format: "Contoh: KES/2026/00001"

**Setelah Submit (Tiket Ditemukan)**:
Tampilkan card informasi berisi:
```
Nomor Tiket : KES/2026/00001
OPD Tujuan  : Dinas Kesehatan
Jenis Layanan: Layanan Imunisasi
Nama Pelapor : Budi Santoso
Tanggal Pengajuan: 15 Mei 2026
Status Saat Ini  : [BADGE STATUS]

Timeline Proses:
✅ 15 Mei 2026 — Pengajuan diterima
✅ 16 Mei 2026 — Diverifikasi oleh Petugas Desa
🔵 Dalam proses penanganan OPD...
```

**Informasi yang TIDAK ditampilkan di halaman publik**:
- NIK pelapor
- Nomor HP pelapor
- Nama kader
- Detail internal admin

**Jika Tiket Tidak Ditemukan**:
Tampilkan pesan: "Nomor tiket tidak ditemukan. Pastikan nomor tiket yang Anda masukkan sudah benar."

---

## 20. FITUR LAPORAN & ANALITIK

**URL**: `/admin/laporan`
**Akses**: Admin DPMD only

### Ringkasan Global
- Total pengajuan seluruh OPD
- Pengajuan per bulan (line chart)
- Distribusi per OPD (pie chart atau bar chart)
- Rata-rata waktu penyelesaian
- Persentase diselesaikan tepat waktu (dalam SOP)

### Laporan Per OPD
Untuk setiap OPD, tampilkan:
- Total pengajuan masuk
- Jumlah selesai
- Jumlah ditolak
- Jumlah masih dalam proses
- Jumlah yang melewati SOP
- Rata-rata waktu penyelesaian (dalam hari kerja)
- Bar chart: pengajuan per bulan (12 bulan terakhir)

### Filter Laporan
- Periode: bulan & tahun (default: bulan berjalan)
- OPD: semua atau spesifik
- Status: semua atau spesifik

### Export
- Tombol "Export PDF" → generate laporan PDF
- Tombol "Export Excel" → generate file Excel

---

## 21. MANAJEMEN MASTER DATA (ADMIN DPMD)

### Kelola OPD (`/admin/master/opd`)
- Tabel daftar OPD (nama, prefix tiket, status aktif)
- Tombol "Tambah OPD" → modal form:
  - Nama OPD *
  - Kode OPD * (unik, contoh: KES)
  - Prefix Tiket * (unik, contoh: KES)
  - Deskripsi
  - Warna Card (color picker)
  - Urutan tampil (angka)
- Edit dan nonaktifkan OPD

### Kelola Jenis Layanan (`/admin/master/layanan`)
- Filter per OPD
- Tabel: Nama Layanan, OPD, Status Aktif, Jumlah Form Fields
- Tombol "Tambah Jenis Layanan"
- Klik layanan → kelola form fields

### Kelola Form Fields (`/admin/master/form-fields/[layananJenisId]`)
- Tabel form fields (label, tipe, wajib, urutan)
- Drag & drop untuk ubah urutan (atau tombol naik/turun)
- Tambah field: modal dengan form:
  - Label Field * (teks yang ditampilkan ke kader)
  - Nama Field * (snake_case, diisi otomatis dari label)
  - Tipe Field * (dropdown: text/textarea/number/date/select/radio/checkbox)
  - Wajib Diisi (toggle)
  - Placeholder (opsional)
  - Teks Bantuan (opsional)
  - Pilihan Opsi (muncul jika tipe select/radio/checkbox): input dinamis tambah/hapus opsi

### Kelola Wilayah (`/admin/master/wilayah`)
- Tab: Kecamatan | Desa | Posyandu
- CRUD untuk setiap level wilayah

### Kelola User (`/admin/master/users`)
- Filter per role, per wilayah/OPD
- Tabel: Nama, Email, Role, Unit (posyandu/desa/kecamatan/OPD), Status, Login Terakhir
- Tombol "Tambah User" → form manual
- Tombol "Import CSV" → upload file CSV
- Nonaktifkan/aktifkan user (toggle)
- Reset password: generate password baru dan tampilkan ke admin

### Kelola Hari Libur (`/admin/master/hari-libur`)
- Tabel daftar hari libur (tanggal, nama)
- Tambah, edit, hapus hari libur

---

## 22. CATATAN IMPLEMENTASI UNTUK AI AGENT

### ⚠️ PENTING — Baca sebelum mulai coding

1. **Gunakan App Router (bukan Pages Router)**. Semua route di `/app/` directory. Server Components by default, Client Components hanya saat butuh interaktivitas (form, state, event handler).

2. **Auth dengan NextAuth v5**. Session di server menggunakan `auth()`, di client menggunakan `useSession()`. Selalu cek session dan role di server-side sebelum memproses request.

3. **Middleware auth**: Buat `/middleware.ts` untuk proteksi route berdasarkan role. Route `/tracking` dan `/api/tracking/*` adalah satu-satunya yang public (tanpa auth).

4. **Prisma**: Buat satu instance Prisma client di `/lib/prisma.ts` menggunakan singleton pattern untuk menghindari connection leak di development.

5. **Ticket generation harus atomic**: Gunakan Prisma transaction dengan `$transaction` dan manual locking saat increment `last_sequence` di tabel `tiket_counters` untuk mencegah nomor tiket duplikat.

6. **Dynamic form rendering**: 
   - Fetch form fields di server component saat halaman form dibuka
   - Kirim fields sebagai props ke client component form
   - Saat submit, validasi setiap field sesuai `is_required` dan `field_type`
   - Kirim `fieldValues` sebagai array: `[{ formFieldId: "uuid", fieldValue: "nilai" }]`

7. **File upload**: Implement di `/api/upload` route. Validasi tipe file (jpg, jpeg, png, pdf) dan ukuran (max 5MB) sebelum upload ke storage. Return URL file yang tersimpan.

8. **Cron job SOP**: Implementasikan di `/api/cron/sop-check`. Proteksi dengan header `Authorization: Bearer {CRON_SECRET}`. Vercel Cron bisa dipanggil setiap hari pukul 07:00 WIB (00:00 UTC). Logic:
   - Ambil semua pengajuan dengan status aktif (bukan SELESAI/DITOLAK)
   - Hitung remaining working days menggunakan fungsi dari `/lib/working-days.ts`
   - Jika remaining <= 2 dan belum `notified_h2`: kirim notif H-2, update flag
   - Jika deadline sudah lewat: kirim notif SOP_EXPIRED ke admin
   - Jika hari kalender sudah >= 10 dari `submitted_at` dan belum auto-bypass: jalankan auto-bypass

9. **Auto-bypass logic**:
   - Cek status: jika `MENUNGGU_VERIFIKASI` → set ke `DALAM_PROSES_OPD`
   - Jika `DALAM_PROSES_OPD` → set ke `SELESAI` dengan `completedAt = now()`
   - Catat di `activity_logs` dengan action "AUTO_BYPASS", `userId = null`
   - Catat di `admin_actions` dengan `actionType = AUTO_BYPASS`, `adminId = null` (atau buat system user)
   - Kirim notifikasi ke semua pihak terkait

10. **Notifikasi in-app**: Bell icon di header menampilkan count unread. Gunakan React Query untuk polling setiap 60 detik (atau SWR). Saat klik dropdown → fetch `/api/notifications` → mark as read via PATCH.

11. **Role-based redirect setelah login**: 
    - KADER → `/kader`
    - PETUGAS_DESA → `/petugas-desa`
    - PETUGAS_KECAMATAN → `/kecamatan`
    - PETUGAS_OPD → `/opd`
    - ADMIN_DPMD → `/admin`

12. **Data scoping per role** (penting! jangan sampai role salah lihat data):
    - KADER: hanya lihat pengajuan yang `kaderId = session.user.id`
    - PETUGAS_DESA: hanya lihat pengajuan yang `desaId = user.desaId`
    - PETUGAS_KECAMATAN: hanya lihat pengajuan yang `desa.kecamatanId = user.kecamatanId`
    - PETUGAS_OPD: hanya lihat pengajuan yang `opdId = user.opdId`
    - ADMIN_DPMD: lihat semua pengajuan

13. **Status CLOSED yang valid**: `DITOLAK_DESA` dan `DITOLAK_OPD` sama-sama berstatus CLOSED permanen. Pengajuan dengan status ini tidak bisa diubah oleh siapapun kecuali ditampilkan sebagai riwayat. Pastikan endpoint API menolak aksi apapun pada pengajuan dengan kedua status ini.

13. **Bahasa Indonesia di UI**: Semua teks, label, placeholder, pesan error, pesan sukses, dan tooltip harus dalam Bahasa Indonesia. Buat file `/lib/messages.ts` untuk konstanta pesan yang bisa digunakan ulang.

14. **Mobile-first Tailwind**: Mulai dari kelas mobile (tanpa prefix), baru tambahkan `md:` dan `lg:` untuk tablet/desktop. Gunakan `min-h-[44px]` untuk semua interactive elements.

15. **Form validation**: Gunakan React Hook Form + Zod. Schema validasi dibuat per form. Pesan error validasi dalam Bahasa Indonesia.

16. **Loading skeleton**: Buat komponen `TableSkeleton`, `CardSkeleton`, `FormSkeleton` yang dapat digunakan di seluruh aplikasi dengan `Suspense`.

17. **Error boundaries**: Buat komponen error boundary untuk menangkap error yang tidak terduga dan menampilkan halaman error yang user-friendly dalam Bahasa Indonesia.

18. **CSV Import**: Gunakan library `papaparse` untuk parsing CSV di browser sebelum upload, agar bisa validasi dan preview sebelum data dikirim ke server.

19. **Environment Variables yang diperlukan**:
```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
CRON_SECRET=                     # untuk proteksi endpoint cron
UPLOAD_STORAGE=cloudinary         # atau: uploadthing
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ENABLE_EMAIL_NOTIFICATIONS=false
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

20. **Seed data awal**: Buat `/prisma/seed.ts` yang mengisi:
    - 1 Admin DPMD (email: admin@dpmd.go.id, password: admin123)
    - 6 OPD default (Pendidikan, Kesehatan, PUPR, Perkim, Satpol PP, Sosial)
    - Contoh data kecamatan dan desa

---

*Dokumentasi ini dibuat sebagai panduan lengkap untuk pembangunan sistem E-Posyandu. Setiap fitur, komponen, dan logika bisnis telah didefinisikan secara eksplisit untuk memastikan implementasi sesuai dengan kebutuhan DPMD Kabupaten Lebak.*

**Versi Dokumen**: 1.0
**Tanggal**: Mei 2026
**Status**: Final — Siap Implementasi
