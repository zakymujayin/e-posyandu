# E-Posyandu — Panduan Deployment

## Prasyarat

- **Node.js** >= 20
- **PostgreSQL** >= 16
- **Redis** (opsional, untuk caching & rate limiting)
- **PM2** (opsional, untuk production process manager)

---

## ⚡ Cara Cepat (1 perintah)

Setelah `.env` diisi (lihat langkah 1 di bawah), cukup jalankan **satu perintah** ini:

```bash
npm run setup      # = install + buat tabel + seed data inti + build
```

Lalu jalankan aplikasinya:

```bash
npm start          # atau: pm2 start start.js --name e-posyandu
```

`npm run setup` otomatis: install dependencies → `prisma db push` → seed wilayah →
seed data inti (user/OPD/layanan/counter, **tanpa** dummy pengajuan/balita/ATS) →
build produksi. Skrip akan berhenti dengan pesan jelas jika `.env`/`DATABASE_URL`
belum diisi.

> Langkah manual di bawah hanya diperlukan kalau ingin menjalankan tiap tahap terpisah.

---

## Deployment Manual (per langkah)

### 1. Siapkan Environment

```bash
cp .env.example .env
```

Edit `.env` — isi variabel wajib berikut:
- `DATABASE_URL` — koneksi PostgreSQL
- `AUTH_SECRET` — generate dengan `openssl rand -base64 32`
- `AUTH_URL` & `NEXTAUTH_URL` — domain aplikasi Anda
- `CRON_SECRET` — generate dengan `openssl rand -base64 32`
- `APP_URL` — domain aplikasi Anda

### 2. Install Dependencies

```bash
npm install
```

> Repo sudah menyertakan `.npmrc` (`legacy-peer-deps=true`), jadi `npm install`
> langsung jalan. **Jangan** pakai `--production` / `--omit=dev` — tool seeder
> (`prisma`, `tsx`, `dotenv`) memang dibutuhkan dan sudah ada di `dependencies`.

### 3. Setup Database (Schema + Data Inti)

Satu perintah untuk membuat semua tabel + mengisi data inti:

```bash
npm run db:setup
```

Setara dengan menjalankan berurutan:

```bash
npm run db:push            # Bikin semua tabel (28 kecamatan + 345 desa diisi via seeder)
npm run db:seed-wilayah    # Isi 28 kecamatan + 345 desa/kelurahan (dari Excel)
npm run db:seed-production # Isi user, OPD, layanan, posyandu, counter
```

> Data yang di-seed: wilayah, semua user, OPD, layanan, counter — **tanpa**
> data dummy pengajuan/balita/ATS. Pastikan `DATABASE_URL` di `.env` sudah benar
> sebelum menjalankan langkah ini.

### 4. Build

```bash
npm run build
```

### 5. Start

```bash
npm start       # default port 3000
# atau dengan custom port:
PORT=8080 npm start
```

### 6. Akses

Buka `http://localhost:3000` (atau domain Anda). Login dengan kredensial default:

| Role | Username | Password |
|------|----------|----------|
| Admin DPMD | `admin_dpmd` | `admin123` |
| Petugas OPD | `opd_dinkes` | `opd123` |
| Petugas Kecamatan | `kec_360214` | `kecamatan123` |
| Petugas Desa | `desa_3602140006` | `petugas123` |
| Posyandu | `posyandu-nameng` | `posyandu123` |

**⚠️ Segera ganti password admin setelah login pertama.**

Kredensial lengkap semua user ada di `docs/DAFTAR USER E-POSYANDU.xlsx`.

---

## Production dengan PM2

```bash
npm install -g pm2
pm2 start start.js --name e-posyandu
pm2 save
pm2 startup
```

## Nginx Reverse Proxy

Contoh konfigurasi ada di `deploy/nginx-e-posyandu.conf`.

---

## Cron Job Setup

Aplikasi butuh cron job untuk pengecekan SOP deadline. Setup via crontab atau cron service:

```bash
# Setiap jam — cek deadline SOP pengajuan
0 * * * * curl -X POST https://domain-anda.com/api/cron/sop-check -H "Authorization: Bearer $CRON_SECRET"
```

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `Error: P1001` (tidak bisa konek DB) | Cek `DATABASE_URL` di `.env`, pastikan PostgreSQL running |
| `Error: P1003` (database tidak ada) | Buat database: `createdb e_posyandu` |
| Login gagal terus | Cek Redis running jika pakai rate limiting, atau cek user `isActive` |
| Upload file gagal | Setup Cloudinary atau pastikan folder `public/uploads/` writable |
| Build gagal | `rm -rf .next node_modules && npm install && npm run build` |

---

## Rotate Secrets

Setelah deployment pertama, generate ulang semua secret:

```bash
# Generate secret baru
openssl rand -base64 32
```

Update di `.env`:
- `AUTH_SECRET`
- `CRON_SECRET`

Ganti password database via PostgreSQL:
```sql
ALTER USER your_user PASSWORD 'new_strong_password';
```

Update `DATABASE_URL` di `.env` dengan password baru.
