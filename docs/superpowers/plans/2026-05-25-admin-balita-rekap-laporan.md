# Admin Balita Rekap Drill-down & Laporan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ADMIN_DPMD can drill down from kecamatan → desa → posyandu → list balita → detail balita, and has a laporan balita dashboard with charts & export.

**Architecture:** Reuse existing rekap API endpoints (`all`, `kecamatan/[kecId]`, `desa/[desaId]`) which already support ADMIN_DPMD. Add one new API for list balita per posyandu. Add two new API endpoints for laporan statistik & export. All new pages follow the same server-component pattern as existing rekap pages. The detail balita page is standalone (no shared component extraction — simpler & safer than refactoring 600-line `BalitaDetail`).

**Tech Stack:** Next.js 16 (App Router, server components), Prisma 7, Tailwind CSS v4, Recharts (for laporan charts), date-fns.

---

### Task 1: API — List Balita per Posyandu

**File:** Create `src/app/api/rekap/balita/posyandu/[posyanduId]/route.ts`

New endpoint that returns list of balita within a posyandu, accessible by ADMIN_DPMD and PETUGAS_DESA. Includes latest penimbangan status for each balita (ditimbang bulan ini / belum).

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest, { params }: { params: Promise<{ posyanduId: string }> }) {
  const { user, response } = await requireAuth(["PETUGAS_DESA", "ADMIN_DPMD"])
  if (!user) return response!

  try {
    const { posyanduId } = await params

    if (user.role === "PETUGAS_DESA") {
      const petugas = await prisma.user.findUnique({ where: { id: user.id }, select: { desaId: true } })
      if (petugas?.desaId) {
        const posyandu = await prisma.posyandu.findUnique({ where: { id: posyanduId }, select: { desaId: true } })
        if (!posyandu || posyandu.desaId !== petugas.desaId) return err("Akses ditolak", 403)
      }
    }

    const now = new Date()
    const bulanIni = now.getMonth() + 1
    const tahunIni = now.getFullYear()

    const balitas = await prisma.balita.findMany({
      where: { posyanduId, isActive: true },
      select: {
        id: true,
        namaBalita: true,
        jenisKelamin: true,
        tanggalLahir: true,
        namaOrangTua: true,
        penimbangans: {
          where: { bulan: bulanIni, tahun: tahunIni },
          select: { id: true, beratBadan: true, statusGizi: true },
          take: 1,
        },
      },
      orderBy: { namaBalita: "asc" },
    })

    const data = balitas.map((b) => ({
      id: b.id,
      namaBalita: b.namaBalita,
      jenisKelamin: b.jenisKelamin,
      tanggalLahir: b.tanggalLahir,
      namaOrangTua: b.namaOrangTua,
      ditimbangBulanIni: b.penimbangans.length > 0,
      beratBadan: b.penimbangans[0]?.beratBadan ?? null,
      statusGizi: b.penimbangans[0]?.statusGizi ?? null,
    }))

    return ok(data)
  } catch (e) {
    console.error("[GET /api/rekap/balita/posyandu/[posyanduId]]", e)
    return err("Gagal mengambil data balita", 500)
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/rekap/balita/posyandu/\[posyanduId\]/route.ts
git commit -m "feat(api): add list balita per posyandu endpoint for ADMIN_DPMD"
```

---

### Task 2: API — Balita Detail Accessible by ADMIN_DPMD

**File:** Modify `src/app/api/balita/[id]/route.ts`

Add `ADMIN_DPMD` to the `requireAuth` call in the GET handler, and modify the data fetching to not restrict by posyanduId when the user is ADMIN_DPMD.

- [ ] **Step 1: Modify GET handler**

Change line 24:
```typescript
  const { user, response } = await requireAuth(["POSYANDU"])
```
to:
```typescript
  const { user, response } = await requireAuth(["POSYANDU", "ADMIN_DPMD"])
```

Add role check inside try block after `const { id } = await params`:
```typescript
    let balita
    if (user.role === "ADMIN_DPMD") {
      balita = await prisma.balita.findUnique({
        where: { id },
        select: { id: true, posyanduId: true },
      })
      if (!balita) return err("Data tidak ditemukan", 404)
    } else {
      balita = await getBalitaForUser(id, user.id)
      if (!balita) return err("Data tidak ditemukan", 404)
    }
```

The full GET after changes:
```typescript
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["POSYANDU", "ADMIN_DPMD"])
  if (!user) return response!

  try {
    const { id } = await params

    if (user.role === "ADMIN_DPMD") {
      const balita = await prisma.balita.findUnique({
        where: { id },
        select: { id: true, posyanduId: true },
      })
      if (!balita) return err("Data tidak ditemukan", 404)
    } else {
      const balita = await getBalitaForUser(id, user.id)
      if (!balita) return err("Data tidak ditemukan", 404)
    }

    const full = await prisma.balita.findUnique({
      where: { id },
      include: {
        penimbangans: { orderBy: [{ tahun: "asc" }, { bulan: "asc" }] },
        imunisasis: { orderBy: { tanggalPemberian: "asc" } },
      },
    })

    return ok(full)
  } catch (e) {
    console.error("[GET /api/balita/[id]]", e)
    return err("Gagal mengambil data balita", 500)
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/balita/\[id\]/route.ts
git commit -m "feat(api): allow ADMIN_DPMD to access balita detail endpoint"
```

---

### Task 3: Admin Rekap-Balita — Add Kecamatan Links

**File:** Modify `src/app/(dashboard)/admin/rekap-balita/page.tsx`

Make the kecamatan name in the table clickable, linking to `admin/rekap-balita/[kecId]`.

- [ ] **Step 1: Add Link import**

Add `import Link from "next/link"` at the top with other imports.

- [ ] **Step 2: Wrap kecamatan name cell with Link**

```typescript
<TableCell className="px-4 py-3.5 font-semibold text-sm">
  <Link href={`/admin/rekap-balita/${kec.id}`} className="hover:text-blue-600 hover:underline transition-colors">
    {kec.name}
  </Link>
</TableCell>
```

- [ ] **Step 3: Add loading state**

Create `src/app/(dashboard)/admin/rekap-balita/loading.tsx`:
```typescript
export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <div className="h-7 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-72 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-xl animate-pulse" />
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/admin/rekap-balita/
git commit -m "feat(admin): add kecamatan drill-down links to rekap-balita page"
```

---

### Task 4: Admin Drill-Down Page — Desa Level

**File:** Create `src/app/(dashboard)/admin/rekap-balita/[kecId]/page.tsx`

Server component that fetches desa-level rekap for a given kecamatan (reuse API pattern from `api/rekap/balita/kecamatan/[kecId]`). Renders table of desas, each clickable to drill down further.

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { StatCard } from "@/components/shared/stat-card"
import { Badge } from "@/components/ui/badge"
import { Baby, CheckCircle2, AlertCircle, MapPin } from "lucide-react"

export default async function RekapBalitaKecDetailPage({
  params,
}: {
  params: Promise<{ kecId: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const { kecId } = await params
  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const kecamatan = await prisma.kecamatan.findUnique({
    where: { id: kecId },
    select: { name: true },
  })
  if (!kecamatan) redirect("/admin/rekap-balita")

  const desas = await prisma.desa.findMany({
    where: { kecamatanId: kecId },
    select: { id: true, name: true, posyandus: { select: { id: true } } },
    orderBy: { name: "asc" },
  })

  const posyanduToDesaMap = new Map<string, string>()
  for (const d of desas) {
    for (const p of d.posyandus) posyanduToDesaMap.set(p.id, d.id)
  }
  const allPosyanduIds = Array.from(posyanduToDesaMap.keys())

  const [totalRows, weighedRows] = await Promise.all([
    prisma.balita.groupBy({
      by: ["posyanduId"],
      where: { posyanduId: { in: allPosyanduIds }, isActive: true },
      _count: { id: true },
    }),
    prisma.penimbanganBalita.findMany({
      where: {
        bulan: bulanIni,
        tahun: tahunIni,
        balita: { posyanduId: { in: allPosyanduIds }, isActive: true },
      },
      select: { balitaId: true, balita: { select: { posyanduId: true } } },
      distinct: ["balitaId"],
    }),
  ])

  const totalByDesa = new Map<string, number>()
  for (const row of totalRows) {
    const desaId = posyanduToDesaMap.get(row.posyanduId)
    if (desaId) totalByDesa.set(desaId, (totalByDesa.get(desaId) ?? 0) + row._count.id)
  }

  const ditimbangByDesa = new Map<string, number>()
  for (const row of weighedRows) {
    const desaId = posyanduToDesaMap.get(row.balita.posyanduId)
    if (desaId) ditimbangByDesa.set(desaId, (ditimbangByDesa.get(desaId) ?? 0) + 1)
  }

  const rows = desas.map((d) => {
    const total = totalByDesa.get(d.id) ?? 0
    const ditimbang = ditimbangByDesa.get(d.id) ?? 0
    return { ...d, total, ditimbang, belum: total - ditimbang }
  })

  const totalBalita = rows.reduce((s, r) => s + r.total, 0)
  const totalDitimbang = rows.reduce((s, r) => s + r.ditimbang, 0)

  const stats = [
    { label: "Total Desa", value: desas.length, icon: MapPin, variant: "primary" as const },
    { label: "Total Balita", value: totalBalita, icon: Baby, variant: "accent" as const },
    { label: "Ditimbang Bulan Ini", value: totalDitimbang, icon: CheckCircle2, variant: "secondary" as const },
    { label: "Belum Ditimbang", value: totalBalita - totalDitimbang, icon: AlertCircle, variant: "destructive" as const },
  ]

  const BULAN_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][bulanIni - 1]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={kecamatan.name}
        description={`Status penimbangan balita per desa — ${BULAN_LABEL} ${tahunIni}`}
        backHref="/admin/rekap-balita"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} title={s.label} value={s.value} icon={s.icon} colorVariant={s.variant} />
        ))}
      </div>

      <DataTable columns={["Desa", "Total Posyandu", "Total Balita", "Ditimbang", "Belum", "Status"]} dataLength={rows.length}>
        {rows.map((r) => {
          const pct = r.total > 0 ? Math.round((r.ditimbang / r.total) * 100) : 0
          return (
            <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="px-4 py-3.5 font-semibold text-sm">
                <Link href={`/admin/rekap-balita/${kecId}/${r.id}`} className="hover:text-blue-600 hover:underline transition-colors">
                  {r.name}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-muted-foreground">{r.posyandus.length}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">{r.total}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-emerald-700 font-semibold">{r.ditimbang}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">
                <span className={r.belum > 0 ? "text-amber-700 font-semibold" : "text-muted-foreground"}>{r.belum}</span>
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <Badge className={`text-xs ${
                  pct === 100
                    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                    : pct >= 50
                    ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`} variant="outline">{pct}% ditimbang</Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </DataTable>
    </PageContainer>
  )
}
```

- [ ] **Step 1: Create the page file**

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/admin/rekap-balita/\[kecId\]/
git commit -m "feat(admin): add desa-level rekap balita drill-down page"
```

---

### Task 5: Admin Drill-Down Page — Posyandu Level

**File:** Create `src/app/(dashboard)/admin/rekap-balita/[kecId]/[desaId]/page.tsx`

Server component showing rekap per posyandu in a desa. Each posyandu row links to the balita list page.

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { StatCard } from "@/components/shared/stat-card"
import { Badge } from "@/components/ui/badge"
import { Baby, CheckCircle2, AlertCircle, Scale } from "lucide-react"

export default async function RekapBalitaDesaDetailPage({
  params,
}: {
  params: Promise<{ kecId: string; desaId: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const { kecId, desaId } = await params
  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const desa = await prisma.desa.findUnique({
    where: { id: desaId },
    select: { name: true, kecamatanId: true, kecamatan: { select: { name: true } } },
  })
  if (!desa || desa.kecamatanId !== kecId) redirect("/admin/rekap-balita")

  const posyandus = await prisma.posyandu.findMany({
    where: { desaId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const posyanduIds = posyandus.map((p) => p.id)

  const [totalRows, weighedRows] = await Promise.all([
    prisma.balita.groupBy({
      by: ["posyanduId"],
      where: { posyanduId: { in: posyanduIds }, isActive: true },
      _count: { id: true },
    }),
    prisma.penimbanganBalita.findMany({
      where: {
        bulan: bulanIni,
        tahun: tahunIni,
        balita: { posyanduId: { in: posyanduIds }, isActive: true },
      },
      select: { balitaId: true, balita: { select: { posyanduId: true } } },
      distinct: ["balitaId"],
    }),
  ])

  const totalMap = new Map(totalRows.map((r) => [r.posyanduId, r._count.id]))
  const ditimbangMap = new Map<string, number>()
  for (const row of weighedRows) {
    const pid = row.balita.posyanduId
    ditimbangMap.set(pid, (ditimbangMap.get(pid) ?? 0) + 1)
  }

  const rows = posyandus.map((p) => {
    const total = totalMap.get(p.id) ?? 0
    const ditimbang = ditimbangMap.get(p.id) ?? 0
    return { ...p, total, ditimbang, belum: total - ditimbang }
  })

  const totalBalita = rows.reduce((s, r) => s + r.total, 0)
  const totalDitimbang = rows.reduce((s, r) => s + r.ditimbang, 0)

  const stats = [
    { label: "Total Posyandu", value: posyandus.length, icon: Scale, variant: "primary" as const },
    { label: "Total Balita", value: totalBalita, icon: Baby, variant: "accent" as const },
    { label: "Ditimbang Bulan Ini", value: totalDitimbang, icon: CheckCircle2, variant: "secondary" as const },
    { label: "Belum Ditimbang", value: totalBalita - totalDitimbang, icon: AlertCircle, variant: "destructive" as const },
  ]

  const BULAN_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][bulanIni - 1]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={desa.name}
        description={`Kec. ${desa.kecamatan.name} — ${BULAN_LABEL} ${tahunIni}`}
        backHref={`/admin/rekap-balita/${kecId}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} title={s.label} value={s.value} icon={s.icon} colorVariant={s.variant} />
        ))}
      </div>

      <DataTable columns={["Posyandu", "Total Balita", "Ditimbang", "Belum Ditimbang", "Status"]} dataLength={rows.length}>
        {rows.map((r) => {
          const pct = r.total > 0 ? Math.round((r.ditimbang / r.total) * 100) : 0
          return (
            <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="px-4 py-3.5 font-semibold text-sm">
                <Link href={`/admin/rekap-balita/${kecId}/${desaId}/${r.id}`} className="hover:text-blue-600 hover:underline transition-colors">
                  {r.name}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">{r.total}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center text-emerald-700 font-semibold">{r.ditimbang}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">
                <span className={r.belum > 0 ? "text-amber-700 font-semibold" : "text-muted-foreground"}>{r.belum}</span>
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <Badge className={`text-xs ${
                  pct === 100
                    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                    : pct >= 50
                    ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`} variant="outline">{pct}% ditimbang</Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </DataTable>
    </PageContainer>
  )
}
```

- [ ] **Step 1: Create the page file**

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/admin/rekap-balita/\[kecId\]/\[desaId\]/
git commit -m "feat(admin): add posyandu-level rekap balita drill-down page"
```

---

### Task 6: Admin Drill-Down Page — List Balita

**File:** Create `src/app/(dashboard)/admin/rekap-balita/[kecId]/[desaId]/[posyanduId]/page.tsx`

Fetch balita list from the API endpoint (Task 1) and render a table. Each balita name links to the detail page.

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { differenceInMonths } from "date-fns"
import { Baby, CheckCircle2, XCircle } from "lucide-react"

export default async function RekapBalitaPosyanduDetailPage({
  params,
}: {
  params: Promise<{ kecId: string; desaId: string; posyanduId: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const { kecId, desaId, posyanduId } = await params

  const posyandu = await prisma.posyandu.findUnique({
    where: { id: posyanduId },
    select: { name: true, desaId: true, desa: { select: { name: true, kecamatanId: true } } },
  })
  if (!posyandu || posyandu.desaId !== desaId) redirect("/admin/rekap-balita")

  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const balitas = await prisma.balita.findMany({
    where: { posyanduId, isActive: true },
    select: {
      id: true,
      namaBalita: true,
      jenisKelamin: true,
      tanggalLahir: true,
      namaOrangTua: true,
      penimbangans: {
        where: { bulan: bulanIni, tahun: tahunIni },
        select: { id: true, beratBadan: true, statusGizi: true },
        take: 1,
      },
    },
    orderBy: { namaBalita: "asc" },
  })

  const BULAN_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][bulanIni - 1]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={posyandu.name}
        description={`Desa ${posyandu.desa.name} · Status penimbangan ${BULAN_LABEL} ${tahunIni}`}
        backHref={`/admin/rekap-balita/${kecId}/${desaId}`}
      />

      <DataTable columns={["Nama Balita", "Usia", "JK", "Orang Tua", "Ditimbang", "BB", "Status Gizi"]} dataLength={balitas.length}>
        {balitas.map((b) => {
          const usia = differenceInMonths(now, b.tanggalLahir)
          const ditimbang = b.penimbangans.length > 0
          return (
            <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="px-4 py-3.5 font-semibold text-sm">
                <Link href={`/admin/rekap-balita/balita/${b.id}`} className="hover:text-blue-600 hover:underline transition-colors">
                  {b.namaBalita}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">{usia} bln</TableCell>
              <TableCell className="px-4 py-3.5 text-sm">{b.jenisKelamin === "LAKI_LAKI" ? "L" : "P"}</TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">{b.namaOrangTua}</TableCell>
              <TableCell className="px-4 py-3.5 text-center">
                {ditimbang ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-600 inline" />
                )}
              </TableCell>
              <TableCell className="px-4 py-3.5 text-sm text-center">{b.penimbangans[0]?.beratBadan ? `${b.penimbangans[0].beratBadan} kg` : "—"}</TableCell>
              <TableCell className="px-4 py-3.5">
                {b.penimbangans[0]?.statusGizi ? (
                  <Badge variant="outline" className="text-xs">{b.penimbangans[0].statusGizi}</Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </DataTable>
    </PageContainer>
  )
}
```

- [ ] **Step 1: Create the page file**

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/admin/rekap-balita/\[kecId\]/\[desaId\]/\[posyanduId\]/
git commit -m "feat(admin): add balita list drill-down page for posyandu"
```

---

### Task 7: Admin Drill-Down Page — Detail Balita

**File:** Create `src/app/(dashboard)/admin/rekap-balita/balita/[balitaId]/page.tsx`

A read-only detail page for ADMIN_DPMD. Uses a client component that fetches balita data via the API and displays info + penimbangan + imunisasi without any edit/delete buttons.

Create the client component: `src/components/admin/balita-detail-view.tsx`

```typescript
"use client"

import { useEffect, useState } from "react"
import { format, differenceInMonths } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { Scale, Syringe, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const BULAN_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

interface BalitaData {
  id: string
  namaBalita: string
  jenisKelamin: string
  tanggalLahir: string
  namaOrangTua: string
  nikOrangTua: string | null
  noHpOrangTua: string | null
  alamat: string | null
  catatanKesehatan: string | null
  penimbangans: Array<{
    id: string
    bulan: number
    tahun: number
    beratBadan: number | null
    tinggiBadan: number | null
    lingkarKepala: number | null
    statusGizi: string | null
    keluhanKondisi: string | null
    tindakan: string | null
    namaKader: string | null
  }>
  imunisasis: Array<{
    id: string
    jenisImunisasi: string
    tanggalPemberian: string
    usiaAnak: string | null
    namaPetugas: string | null
    keterangan: string | null
  }>
}

export function BalitaDetailView({ balitaId }: { balitaId: string }) {
  const [balita, setBalita] = useState<BalitaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<"penimbangan" | "imunisasi">("penimbangan")
  const [tahun, setTahun] = useState(new Date().getFullYear())

  useEffect(() => {
    fetch(`/api/balita/${balitaId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setBalita(d.data)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [balitaId])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  if (error || !balita) return <p className="text-center py-20 text-destructive">Gagal memuat data balita</p>

  const now = new Date()
  const penimbanganTahunIni = balita.penimbangans.filter((p) => p.tahun === tahun)

  function penimbanganForBulan(bulan: number) {
    return penimbanganTahunIni.find((p) => p.bulan === bulan)
  }

  function isFutureBulan(bulan: number) {
    return tahun > now.getFullYear() || (tahun === now.getFullYear() && bulan > now.getMonth() + 1)
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="rounded-xl border border-border bg-card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Nama Orang Tua / Wali</p>
          <p className="font-semibold mt-0.5">{balita.namaOrangTua}</p>
        </div>
        {balita.nikOrangTua && (
          <div>
            <p className="text-xs text-muted-foreground">NIK</p>
            <p className="font-semibold mt-0.5 font-mono">{balita.nikOrangTua}</p>
          </div>
        )}
        {balita.noHpOrangTua && (
          <div>
            <p className="text-xs text-muted-foreground">No. HP</p>
            <p className="font-semibold mt-0.5">{balita.noHpOrangTua}</p>
          </div>
        )}
        {balita.alamat && (
          <div>
            <p className="text-xs text-muted-foreground">Alamat</p>
            <p className="font-semibold mt-0.5">{balita.alamat}</p>
          </div>
        )}
      </div>

      {/* Catatan Kesehatan */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <p className="text-xs font-bold text-foreground">Catatan Kesehatan</p>
        <p className="text-sm text-muted-foreground">{balita.catatanKesehatan || "—"}</p>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border">
          {([{ key: "penimbangan", label: "Penimbangan Bulanan", icon: Scale }, { key: "imunisasi", label: "Riwayat Imunisasi", icon: Syringe }] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === key ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "penimbangan" && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setTahun((y) => y - 1)} className="px-2 py-1 rounded border border-border text-xs hover:bg-muted/40">‹</button>
              <span className="text-sm font-bold w-16 text-center">{tahun}</span>
              <button onClick={() => setTahun((y) => y + 1)} disabled={tahun >= now.getFullYear()} className="px-2 py-1 rounded border border-border text-xs hover:bg-muted/40 disabled:opacity-30">›</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {BULAN_NAMES.map((name, i) => {
                const bulan = i + 1
                const data = penimbanganForBulan(bulan)
                const isFuture = isFutureBulan(bulan)
                return (
                  <div key={bulan} className={`rounded-lg border p-3 text-xs space-y-1 ${
                    isFuture ? "border-border/50 bg-muted/20 opacity-40" : data ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{name}</span>
                    </div>
                    {data ? (
                      <>
                        {data.beratBadan && <p className="text-emerald-700 font-bold">{data.beratBadan} kg</p>}
                        {data.tinggiBadan && <p className="text-muted-foreground">{data.tinggiBadan} cm</p>}
                        {data.statusGizi && <Badge variant="outline" className="text-[10px] px-1 py-0">{data.statusGizi}</Badge>}
                      </>
                    ) : isFuture ? (
                      <p className="text-muted-foreground">—</p>
                    ) : (
                      <p className="text-muted-foreground">Belum dicatat</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === "imunisasi" && (
          <div className="p-5 space-y-4">
            {balita.imunisasis.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada data imunisasi.</p>
            ) : (
              <div className="space-y-2">
                {balita.imunisasis.map((im) => (
                  <div key={im.id} className="flex items-start gap-3 rounded-lg border border-border px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{im.jenisImunisasi}</p>
                        {im.usiaAnak && <Badge variant="outline" className="text-[10px]">{im.usiaAnak}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(im.tanggalPemberian), "d MMMM yyyy", { locale: localeId })}
                        {im.namaPetugas && ` · ${im.namaPetugas}`}
                      </p>
                      {im.keterangan && <p className="text-xs text-muted-foreground mt-0.5">{im.keterangan}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

The page component:
```typescript
import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { BalitaDetailView } from "@/components/admin/balita-detail-view"
import { differenceInMonths, format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export default async function AdminBalitaDetailPage({
  params,
}: {
  params: Promise<{ balitaId: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const { balitaId } = await params

  const balita = await prisma.balita.findUnique({
    where: { id: balitaId },
    select: { namaBalita: true, tanggalLahir: true, jenisKelamin: true },
  })
  if (!balita) notFound()

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={balita.namaBalita}
        description={`${differenceInMonths(new Date(), balita.tanggalLahir)} bulan · ${balita.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"} · Lahir ${format(balita.tanggalLahir, "d MMMM yyyy", { locale: localeId })}`}
        backHref={"/admin/rekap-balita"}
      />
      <BalitaDetailView balitaId={balitaId} />
    </PageContainer>
  )
}
```

- [ ] **Step 1: Create `src/components/admin/balita-detail-view.tsx`**

- [ ] **Step 2: Create `src/app/(dashboard)/admin/rekap-balita/balita/[balitaId]/page.tsx`**

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/balita-detail-view.tsx src/app/\(dashboard\)/admin/rekap-balita/balita/
git commit -m "feat(admin): add balita detail page for ADMIN_DPMD"
```

---

### Task 8: API — Laporan Balita Statistik

**File:** Create `src/app/api/admin/laporan/balita/statistik/route.ts`

Returns summary stats and chart data for the laporan balita dashboard.

```typescript
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  try {
    const { searchParams } = new URL(req.url)
    const kecId = searchParams.get("kecId")
    const desaId = searchParams.get("desaId")
    const tahun = parseInt(searchParams.get("tahun") ?? String(new Date().getFullYear()))

    const now = new Date()
    const bulanIni = now.getMonth() + 1
    const tahunIni = now.getFullYear()

    // Build posyandu filter
    const posyanduFilter: Record<string, unknown> = {}
    if (desaId) {
      posyanduFilter.desaId = desaId
    } else if (kecId) {
      posyanduFilter.desa = { kecamatanId: kecId }
    }

    const posyandus = await prisma.posyandu.findMany({
      where: posyanduFilter,
      select: { id: true },
    })
    const posyanduIds = posyandus.map((p) => p.id)

    const balitaWhere = posyanduIds.length > 0
      ? { posyanduId: { in: posyanduIds }, isActive: true }
      : { isActive: true }

    // Parallel queries
    const [
      totalBalita,
      ditimbangBulanIni,
      statusGiziDistribution,
      monthlyTrend,
    ] = await Promise.all([
      prisma.balita.count({ where: balitaWhere }),
      prisma.penimbanganBalita.count({
        where: {
          bulan: bulanIni,
          tahun: tahunIni,
          balita: balitaWhere,
        },
      }),
      prisma.penimbanganBalita.groupBy({
        by: ["statusGizi"],
        where: {
          balita: balitaWhere,
          tahun: tahunIni,
          statusGizi: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const m = i + 1
          return prisma.penimbanganBalita
            .count({
              where: {
                bulan: m,
                tahun: tahun,
                balita: balitaWhere,
              },
            })
            .then((count) => ({ bulan: m, count }))
        })
      ),
    ])

    return ok({
      summary: {
        totalBalita,
        ditimbangBulanIni,
        belumDitimbang: totalBalita - ditimbangBulanIni,
        persentaseDitimbang: totalBalita > 0 ? Math.round((ditimbangBulanIni / totalBalita) * 100) : 0,
      },
      statusGizi: statusGiziDistribution.map((r) => ({
        status: r.statusGizi ?? "Tidak diketahui",
        count: r._count.id,
      })),
      monthlyTrend: monthlyTrend.map((m) => ({
        bulan: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][m.bulan - 1],
        count: m.count,
      })),
    })
  } catch (e) {
    console.error("[GET /api/admin/laporan/balita/statistik]", e)
    return err("Gagal mengambil data statistik", 500)
  }
}
```

- [ ] **Step 1: Create the route file**

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/laporan/balita/statistik/route.ts
git commit -m "feat(api): add laporan balita statistik endpoint"
```

---

### Task 9: API — Laporan Balita Export CSV

**File:** Create `src/app/api/admin/laporan/balita/export/route.ts`

Exports balita data with latest penimbangan as CSV, filterable by region.

```typescript
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { searchParams } = new URL(req.url)
  const kecId = searchParams.get("kecId")
  const desaId = searchParams.get("desaId")
  const posyanduId = searchParams.get("posyanduId")
  const bulan = parseInt(searchParams.get("bulan") ?? String(new Date().getMonth() + 1))
  const tahun = parseInt(searchParams.get("tahun") ?? String(new Date().getFullYear()))

  const posyanduFilter: Record<string, unknown> = {}
  if (posyanduId) {
    posyanduFilter.id = posyanduId
  } else if (desaId) {
    posyanduFilter.desaId = desaId
  } else if (kecId) {
    posyanduFilter.desa = { kecamatanId: kecId }
  }

  const balitas = await prisma.balita.findMany({
    where: {
      ...(Object.keys(posyanduFilter).length > 0 ? { posyandu: posyanduFilter } : {}),
      isActive: true,
    },
    include: {
      posyandu: { select: { name: true, desa: { select: { name: true, kecamatan: { select: { name: true } } } } } },
      penimbangans: { where: { bulan, tahun }, take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: [{ posyandu: { name: "asc" } }, { namaBalita: "asc" }],
    take: 10000,
  })

  const headers = [
    "Nama Balita", "Jenis Kelamin", "Tanggal Lahir", "Usia (bln)",
    "Nama Orang Tua", "Alamat",
    "Posyandu", "Desa", "Kecamatan",
    "BB (kg)", "TB (cm)", "LK (cm)", "Status Gizi",
  ]

  const now = new Date()
  const rows = balitas.map((b) => {
    const usia = Math.floor((now.getTime() - new Date(b.tanggalLahir).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    const p = b.penimbangans[0]
    return [
      b.namaBalita,
      b.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan",
      format(new Date(b.tanggalLahir), "d MMMM yyyy", { locale: localeId }),
      String(usia),
      b.namaOrangTua,
      b.alamat ?? "",
      b.posyandu.name,
      b.posyandu.desa.name,
      b.posyandu.desa.kecamatan.name,
      p?.beratBadan?.toString() ?? "",
      p?.tinggiBadan?.toString() ?? "",
      p?.lingkarKepala?.toString() ?? "",
      p?.statusGizi ?? "",
    ]
  })

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  const filename = `laporan-balita-${format(new Date(), "yyyy-MM-dd")}.csv`

  return new Response("\ufeff" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
```

- [ ] **Step 1: Create the route file**

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/laporan/balita/export/route.ts
git commit -m "feat(api): add laporan balita export CSV endpoint"
```

---

### Task 10: Admin Laporan Balita Page

**File:** Create `src/app/(dashboard)/admin/laporan-balita/page.tsx`

Dashboard page with summary cards, charts, and export button, following the same pattern as `admin/laporan/page.tsx`.

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { Baby, CheckCircle2, AlertCircle, Activity } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { LaporanBalitaCharts } from "@/components/admin/laporan-balita-charts"
import { LaporanBalitaExport } from "@/components/admin/laporan-balita-export"

export default async function LaporanBalitaPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const [totalBalita, ditimbangBulanIni] = await Promise.all([
    prisma.balita.count({ where: { isActive: true } }),
    prisma.penimbanganBalita.count({
      where: { bulan: bulanIni, tahun: tahunIni, balita: { isActive: true } },
    }),
  ])

  const belumDitimbang = totalBalita - ditimbangBulanIni
  const persentase = totalBalita > 0 ? Math.round((ditimbangBulanIni / totalBalita) * 100) : 0
  const BULAN_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][bulanIni - 1]

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Laporan Data Balita"
        description={`Data per ${format(now, "d MMMM yyyy", { locale: localeId })}`}
        backHref="/admin"
        actions={<LaporanBalitaExport />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Balita Aktif" value={totalBalita} icon={Baby} colorVariant="primary" />
        <StatCard title={`Ditimbang ${BULAN_LABEL}`} value={ditimbangBulanIni} icon={CheckCircle2} colorVariant="secondary" description={`${persentase}%`} />
        <StatCard title={`Belum ${BULAN_LABEL}`} value={belumDitimbang} icon={AlertCircle} colorVariant="destructive" />
        <StatCard title="Sasaran Posyandu" value={totalBalita} icon={Activity} colorVariant="accent" />
      </div>

      <LaporanBalitaCharts />
    </PageContainer>
  )
}
```

Create client component: `src/components/admin/laporan-balita-charts.tsx`

```typescript
"use client"

import { useEffect, useState } from "react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Loader2 } from "lucide-react"

interface StatData {
  summary: { totalBalita: number; ditimbangBulanIni: number; belumDitimbang: number; persentaseDitimbang: number }
  statusGizi: Array<{ status: string; count: number }>
  monthlyTrend: Array<{ bulan: string; count: number }>
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"]

export function LaporanBalitaCharts() {
  const [data, setData] = useState<StatData | null>(null)

  useEffect(() => {
    fetch("/api/admin/laporan/balita/statistik")
      .then((r) => r.json())
      .then((d) => { if (d.data) setData(d.data) })
      .catch(console.error)
  }, [])

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Monthly Trend */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-base font-bold text-foreground mb-4">Tren Penimbangan 12 Bulan</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.monthlyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "Balita"]} />
            <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#colorBalita)" dot={{ r: 3, fill: "#10b981" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Gizi Distribution */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Distribusi Status Gizi</h2>
          {data.statusGizi.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.statusGizi}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {data.statusGizi.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Bar */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Penimbangan per Bulan</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlyTrend} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, "Balita"]} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
```

Create client component: `src/components/admin/laporan-balita-export.tsx`

```typescript
"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LaporanBalitaExport() {
  function handleExportCsv() {
    window.open("/api/admin/laporan/balita/export", "_blank")
  }

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={handleExportCsv} className="font-bold text-xs gap-1.5">
        <Download className="w-3.5 h-3.5" />
        Export CSV
      </Button>
    </div>
  )
}
```

- [ ] **Step 1: Create `src/components/admin/laporan-balita-charts.tsx`**

- [ ] **Step 2: Create `src/components/admin/laporan-balita-export.tsx`**

- [ ] **Step 3: Create `src/app/(dashboard)/admin/laporan-balita/page.tsx`**

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/laporan-balita-charts.tsx src/components/admin/laporan-balita-export.tsx src/app/\(dashboard\)/admin/laporan-balita/
git commit -m "feat(admin): add laporan balita page with charts and export"
```

---

### Task 11: Navigation — Add Laporan Balita to Sidebar

**File:** Modify `src/config/navigation.ts`

Add "Laporan Balita" menu item to ADMIN_DPMD navigation.

- [ ] **Step 1: Add icon import**

Add `PieChart` to the lucide-react imports.

- [ ] **Step 2: Add menu item**

```typescript
ADMIN_DPMD: [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/pengajuan", label: "Pengajuan", icon: FileText },
  { href: "/admin/rekap-balita", label: "Rekap Balita", icon: Baby },
  { href: "/admin/laporan", label: "Laporan Pengajuan", icon: BarChart3 },
  { href: "/admin/laporan-balita", label: "Laporan Balita", icon: PieChart },
  { href: "/admin/master", label: "Master Data", icon: Settings },
],
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/config/navigation.ts
git commit -m "feat(admin): add laporan balita to sidebar navigation"
```

---

### Task 12: Full Build Verification

- [ ] **Step 1: Run full build**

```bash
npx next build
```

Expected: No errors. All pages compile successfully.

- [ ] **Step 2: Push to remote**

```bash
git push origin master
```
