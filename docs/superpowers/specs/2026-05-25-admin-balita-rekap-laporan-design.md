# ADMIN_DPMD — Rekap Balita Drill-down & Laporan Balita

## Latar Belakang

ADMIN_DPMD hanya bisa melihat rekap balita agregat per kecamatan tanpa bisa
melakukan drill-down ke level desa, posyandu, hingga detail balita. Selain itu
belum ada laporan khusus untuk data balita (hanya ada laporan pengajuan).

## Tujuan

1. ADMIN_DPMD bisa melakukan drill-down dari rekap kecamatan → desa → posyandu
   → daftar balita → detail balita.
2. Tersedia halaman laporan balita dengan dashboard statistik dan export CSV.
3. Semua halaman harus responsif di semua ukuran layar.

## Scope

### In Scope

- Halaman drill-down rekap balita untuk ADMIN_DPMD
- Halaman laporan balita untuk ADMIN_DPMD
- API endpoint baru: list balita per posyandu (accessible by ADMIN_DPMD)
- API endpoint: statistik balita untuk charts
- API endpoint: export CSV data balita

### Out of Scope

- Balita CRUD untuk ADMIN_DPMD (tetap hanya POSYANDU yang bisa create/edit)
- Rekap/laporan untuk role PETUGAS_OPD
- Dashboard untuk POSYANDU (sudah punya halaman balita sendiri)

## Desain

### 1. Drill-down Rekap Balita

#### Struktur Halaman

```
admin/rekap-balita/
  page.tsx                          → tabel per kecamatan (EXISTING)
  [kecId]/page.tsx                  → tabel per desa (NEW)
  [kecId]/[desaId]/page.tsx         → tabel per posyandu (NEW)
  [kecId]/[desaId]/[posyanduId]/page.tsx  → list balita (NEW)
  balita/[balitaId]/page.tsx        → detail balita (NEW)
```

#### Navigasi

- Breadcrumb di setiap halaman: `Rekap Balita > Kecamatan X > Desa Y > Posyandu Z`
- Tiap baris tabel bisa diklik → navigasi ke level berikutnya
- Back button/kembali ke level sebelumnya

#### API

| Endpoint | Method | Roles | Keterangan |
|----------|--------|-------|------------|
| `/api/rekap/balita/all` | GET | ADMIN_DPMD | Existing — rekap per kecamatan |
| `/api/rekap/balita/kecamatan/[kecId]` | GET | ADMIN_DPMD, PETUGAS_KECAMATAN | Existing — rekap per desa |
| `/api/rekap/balita/desa/[desaId]` | GET | ADMIN_DPMD, PETUGAS_DESA | Existing — rekap per posyandu |
| `/api/rekap/balita/posyandu/[posyanduId]` | GET | ADMIN_DPMD, PETUGAS_DESA | **NEW** — list balita per posyandu |
| `/api/balita/[id]` | GET | POSYANDU (existing) | **DIUBAH** — tambah ADMIN_DPMD |

#### Detail Balita

Halaman `admin/rekap-balita/balita/[balitaId]` menampilkan:
- Info balita (nama, tgl lahir, JK, orang tua, alamat)
- Riwayat penimbangan (tabel + grafik BB)
- Riwayat imunisasi (tabel)

**Read-only** — ADMIN_DPMD tidak bisa edit/delete.
**Shared component:** extract `BalitaDetailContent` dari `posyandu/balita/[balitaId]/page.tsx`
ke file terpisah, lalu dipakai oleh kedua halaman. Admin halaman cukup wrapping dengan
layout berbeda tanpa tombol aksi.

#### Responsive

- `≥768px`: Tabel standar
- `<768px`: Card layout (setiap item jadi kartu terpisah)
- Breadcrumb tetap horizontal di mobile (wrap jika perlu)

### 2. Laporan Balita

#### Halaman

```
admin/laporan-balita/
  page.tsx                          → dashboard statistik + export (NEW)
```

#### Layout

**Bagian 1 — Summary Cards:**
- Total Balita Aktif
- Ditimbang Bulan Ini
- Belum Ditimbang
- Status Gizi Kurang/Buruk

**Bagian 2 — Charts:**
- Trend penimbangan 12 bulan (line chart)
- Distribusi status gizi (pie/donut chart)
- Cakupan imunisasi per jenis (bar chart)
- Perbandingan per kecamatan (horizontal bar chart)

**Bagian 3 — Export:**
- Filter: kecamatan, desa, posyandu, bulan, tahun
- Tombol download CSV
- Kolom export: nama balita, posyandu, desa, kecamatan, tgl lahir, JK, orang tua, BB terakhir, TB terakhir, status gizi, imunisasi terakhir

#### API

| Endpoint | Method | Roles | Keterangan |
|----------|--------|-------|------------|
| `/api/admin/laporan/balita/statistik` | GET | ADMIN_DPMD | Data charts + summary |
| `/api/admin/laporan/balita/export` | GET | ADMIN_DPMD | Download CSV |

Param `statistik`: `?kecId=&desaId=&tahun=`
Param `export`: `?kecId=&desaId=&bulan=&tahun=`

#### Layout Responsive

- Cards: `grid-cols-2` di mobile, `grid-cols-4` di desktop
- Charts: full-width di mobile, `grid-cols-2` di desktop
- Filter form: vertical di mobile, inline horizontal di desktop

## Files yang Akan Diubah/Dibuat

### Baru

| File | Keterangan |
|------|------------|
| `admin/rekap-balita/[kecId]/page.tsx` | Rekap per desa untuk ADMIN_DPMD |
| `admin/rekap-balita/[kecId]/[desaId]/page.tsx` | Rekap per posyandu untuk ADMIN_DPMD |
| `admin/rekap-balita/[kecId]/[desaId]/[posyanduId]/page.tsx` | List balita untuk ADMIN_DPMD |
| `admin/rekap-balita/balita/[balitaId]/page.tsx` | Detail balita untuk ADMIN_DPMD |
| `admin/laporan-balita/page.tsx` | Dashboard laporan balita + export |
| `api/rekap/balita/posyandu/[posyanduId]/route.ts` | List balita per posyandu |
| `api/admin/laporan/balita/statistik/route.ts` | Data statistik balita |
| `api/admin/laporan/balita/export/route.ts` | Export CSV balita |

### Diubah

| File | Keterangan |
|------|------------|
| `api/balita/[id]/route.ts` | Tambah ADMIN_DPMD ke requireAuth |
| `admin/rekap-balita/page.tsx` | Tambah link ke halaman [kecId] |
| `posyandu/balita/[balitaId]/page.tsx` | Extract `BalitaDetailContent` ke shared component |

### Shared Component Baru

| File | Keterangan |
|------|------------|
| `components/shared/balita-detail-content.tsx` | Komponen detail balita (read-only) dipakai oleh POSYANDU & ADMIN_DPMD |

## Catatan Implementasi

- Gunakan `DataTable` yang sudah ada untuk tabel
- Gunakan `LaporanCharts` sebagai referensi untuk chart
- Halaman detail balita bisa share komponen dengan `posyandu/balita/[balitaId]`
- Export CSV pakai pattern dari `api/admin/laporan/export/route.ts`
- Semua query balita difilter by `isActive: true` kecuali explicit
