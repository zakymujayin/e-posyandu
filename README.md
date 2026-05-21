# E-Posyandu

Sistem Tatakelola Posyandu & Pengaduan Masyarakat Online
Dinas Pemberdayaan Masyarakat dan Desa (DPMD) Kabupaten Lebak

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Bahasa**: TypeScript
- **Database**: SQLite (dev) / PostgreSQL (prod via libSQL adapter)
- **ORM**: Prisma 7
- **Auth**: NextAuth.js v5 (credentials provider)
- **UI**: shadcn/ui + Tailwind CSS v4 + Lucide React

## Quick Start

### 1. Setup environment

```bash
cp .env.local.example .env.local
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup database

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Jalankan development server

```bash
npm run dev
```

Buka http://localhost:3000

### 5. Login credentials (development)

| Role | Email | Password |
|------|-------|----------|
| Admin DPMD | admin@dpmd.go.id | admin123 |
| Kader | kader@example.com | kader123 |
| Petugas Desa | petugas@example.com | petugas123 |
| Petugas OPD | opd@example.com | opd123 |

## Project Structure

```
src/
├── app/                    ← Next.js App Router pages
│   ├── (auth)/            ← Login page
│   ├── (dashboard)/       ← Dashboard pages per role
│   │   ├── kader/
│   │   ├── petugas-desa/
│   │   ├── kecamatan/
│   │   ├── opd/
│   │   └── admin/
│   ├── tracking/          ← Halaman publik tracking tiket
│   └── api/              ← API routes
├── components/
│   ├── ui/               ← shadcn/ui components
│   └── shared/            ← Shared components (sidebar, header, etc.)
└── lib/                   ← Utilities (auth, prisma, messages, etc.)
```

## Documentation

- [Dokumentasi Teknis](docs/E-POSYANDU_DOKUMENTASI_TEKNIS.md)
- [Spec (Phase A)](docs/superpowers/specs/2026-05-21-e-posyandu-phase-a-design.md)
- [Implementation Plan](docs/superpowers/plans/2026-05-21-e-posyandu-phase-a-plan.md)

## Deployment

Dideploy ke Vercel:

1. Push ke GitHub repo
2. Connect repo ke Vercel
3. Set environment variables di Vercel Dashboard
4. Vercel otomatis deploy dari main branch

## Development Notes

- **Auth**: NextAuth v5 beta — credentials provider + JWT session
- **Role routing**: Middleware proteksi route berdasarkan role
- **Database**: Gunakan `npx prisma db push` untuk schema changes
- **Form**: React Hook Form + Zod
- **State**: Zustand + TanStack Query v5