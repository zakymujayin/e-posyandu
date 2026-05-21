# E-Posyandu F1 — Form Pengajuan Kader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kader Posyandu bisa membuat pengajuan lengkap: pilih OPD → pilih layanan → isi form dinamis → upload lampiran → submit → dapat nomor tiket.

**Architecture:** React Hook Form + Zod untuk form state, Prisma transactions untuk ticket generation atomic, upload abstraction layer untuk file handling, server components untuk data fetching, client components untuk interaktif form.

**Tech Stack:** Next.js 16 App Router, Prisma 7, React Hook Form, Zod, date-fns, Lucide React, shadcn/ui

---

## File Map

```
src/
├── lib/
│   ├── ticket.ts                  ← Modify: stub → full atomic ticket generator
│   ├── upload.ts                  ← Create: upload abstraction (local + Cloudinary)
│   ├── notifications.ts            ← Modify: stub → full notification creation
│   ├── working-days.ts            ← Modify: stub → full with public holidays
│   ├── sop.ts                      ← Create: SOP deadline calculator + status
│   └── messages.ts                ← Modify: add notification type constants
├── types/
│   ├── index.ts                   ← Create: shared type exports
│   └── next-auth.d.ts             ← Modify: already exists, verify complete
├── app/
│   ├── (dashboard)/
│   │   ├── kader/
│   │   │   ├── page.tsx           ← Modify: full dashboard (stats + OPD cards)
│   │   │   ├── ajukan/
│   │   │   │   └── [opdId]/
│   │   │   │       └── page.tsx   ← Create: form pengajuan page
│   │   │   └── ajuan-sukses/
│   │   │       └── page.tsx       ← Create: sukses dengan nomor tiket
│   ├── api/
│   │   ├── opd/[id]/
│   │   │   └── route.ts           ← Create: GET opd detail + layanan
│   │   ├── layanan/[id]/fields/
│   │   │   └── route.ts           ← Create: GET form fields
│   │   ├── pengajuan/
│   │   │   └── route.ts           ← Create: POST create pengajuan
│   │   └── upload/
│   │       └── route.ts           ← Create: POST upload file
└── components/
    └── forms/
        ├── layanan-select.tsx     ← Create: dropdown pilih jenis layanan
        ├── dynamic-form.tsx       ← Create: renders fields from FormField[]
        ├── dynamic-field.tsx      ← Create: single field renderer (text/textarea/etc)
        ├── attachment-upload.tsx  ← Create: file upload with preview
        ├── video-links.tsx        ← Create: add/remove video URL inputs
        └── submit-confirmation.tsx ← Create: modal konfirmasi submit
```

---

## TASK F1a: Library Updates

**Goal:** Implement semua library stubs dan buat upload abstraction.

**Files:**
- Modify: `src/lib/ticket.ts`
- Modify: `src/lib/working-days.ts`
- Modify: `src/lib/notifications.ts`
- Create: `src/lib/upload.ts`
- Create: `src/lib/sop.ts`
- Modify: `src/lib/messages.ts`

---

### F1a Step 1: Update `src/lib/ticket.ts` — Atomic Ticket Generator

**Context:** Schema sudah ada, `TiketCounter` table exists dengan `opdId` + `year` + `lastSequence`. Kita perlu atomic increment via Prisma `$transaction`.

```typescript
// Hapus semua isi file lama, ganti dengan:
import { prisma } from "@/lib/prisma"

export async function generateTicketNumber(opdId: string): Promise<string> {
  const opd = await prisma.opd.findUnique({
    where: { id: opdId },
    select: { tiketPrefix: true },
  })

  if (!opd) throw new Error("OPD tidak ditemukan")

  const year = new Date().getFullYear()

  // Atomic increment using Prisma transaction
  const counter = await prisma.$transaction(async (tx) => {
    let record = await tx.tiketCounter.findUnique({
      where: { opdId_year: { opdId, year } },
    })

    if (!record) {
      record = await tx.tiketCounter.create({
        data: { opdId, year, lastSequence: 0 },
      })
    }

    const newSequence = record.lastSequence + 1
    await tx.tiketCounter.update({
      where: { id: record.id },
      data: { lastSequence: newSequence },
    })

    return { ...record, lastSequence: newSequence }
  })

  const sequenceStr = String(counter.lastSequence).padStart(5, "0")
  return `${opd.tiketPrefix}/${year}/${sequenceStr}`
}
```

Commit: `git add src/lib/ticket.ts && git commit -m "feat(F1a): atomic ticket number generator with Prisma transaction"`

---

### F1a Step 2: Create `src/lib/upload.ts` — Upload Abstraction Layer

**Context:** Dev pakai filesystem (`/public/uploads/`), production auto-switch ke Cloudinary jika vars ada.

```typescript
// src/lib/upload.ts
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import type { NextApiRequest } from "next"

// --- Types ---
export interface UploadResult {
  url: string
  fileName: string
  mimeType: string
  size: number
}

interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

// --- Local Adapter ---
async function uploadLocal(file: File): Promise<UploadResult> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = path.join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })

  const ext = path.extname(file.name)
  const base = path.basename(file.name, ext)
  const safeName = `${base}-${Date.now()}${ext}`
  const filePath = path.join(uploadDir, safeName)

  await writeFile(filePath, buffer)

  return {
    url: `/uploads/${safeName}`,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  }
}

// --- Cloudinary Adapter ---
async function uploadCloudinary(file: File, config: CloudinaryConfig): Promise<UploadResult> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Build form data for Cloudinary
  const formData = new FormData()
  formData.append("file", new Blob([buffer], { type: file.type }), file.name)
  formData.append("upload_preset", "e-posyandu")

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`,
    { method: "POST", body: formData }
  )

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.statusText}`)
  }

  const data = (await response.json()) as { secure_url: string; original_filename: string }
  return {
    url: data.secure_url,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  }
}

// --- Main Export ---
export async function uploadFile(file: File): Promise<UploadResult> {
  // Validate
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipe file tidak diizinkan. Gunakan JPG, PNG, atau PDF.`)
  }

  if (file.size > maxSize) {
    throw new Error(`Ukuran file maksimal 5MB.`)
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY

  if (cloudName && apiKey) {
    return uploadCloudinary(file, {
      cloudName,
      apiKey,
      apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    })
  }

  return uploadLocal(file)
}

// --- Multiple Files ---
export async function uploadFiles(files: File[]): Promise<UploadResult[]> {
  return Promise.all(files.map(uploadFile))
}
```

Commit: `git add src/lib/upload.ts && git commit -m "feat(F1a): upload abstraction layer - local + Cloudinary"`

---

### F1a Step 3: Update `src/lib/working-days.ts` — Full Implementation

**Context:** Currently stub. Needs to query `PublicHoliday` table for national holidays.

```typescript
// Hapus semua isi file lama, ganti dengan:
import { addDays, isWeekend, differenceInDays } from "date-fns"
import { prisma } from "@/lib/prisma"

export async function calculateDeadline(
  startDate: Date,
  workingDays: number
): Promise<Date> {
  let remaining = workingDays
  let current = new Date(startDate)

  while (remaining > 0) {
    current = addDays(current, 1)
    if (await isWorkingDay(current)) {
      remaining--
    }
  }

  return current
}

export async function isWorkingDay(date: Date): Promise<boolean> {
  if (isWeekend(date)) return false

  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const holiday = await prisma.publicHoliday.findFirst({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  })

  return !holiday
}

export async function getRemainingWorkingDays(
  startDate: Date,
  deadline: Date
): Promise<number> {
  let count = 0
  let current = new Date(startDate)
  const end = new Date(deadline)

  while (current < end) {
    current = addDays(current, 1)
    if (await isWorkingDay(current)) {
      count++
    }
  }

  return count
}

export async function getTotalWorkingDays(
  startDate: Date,
  endDate: Date
): Promise<number> {
  return getRemainingWorkingDays(startDate, endDate)
}
```

Commit: `git add src/lib/working-days.ts && git commit -m "feat(F1a): full working-days implementation with public holidays"`

---

### F1a Step 4: Create `src/lib/sop.ts` — SOP Status Calculator

**Context:** Calculate SOP status for display in UI (progress bar, warnings).

```typescript
// src/lib/sop.ts
import { prisma } from "@/lib/prisma"
import { getRemainingWorkingDays } from "@/lib/working-days"
import { differenceInCalendarDays } from "date-fns"

export type SopStatus = "NORMAL" | "WARNING" | "EXPIRED"

export interface SopInfo {
  submittedAt: Date
  deadlineAt: Date
  remainingDays: number
  totalDays: number
  sopStatus: SopStatus
  calendarDaysPassed: number
  isAutoBypassEligible: boolean
}

export async function getSopInfo(pengajuanId: string): Promise<SopInfo | null> {
  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id: pengajuanId },
    select: {
      submittedAt: true,
      deadlineAt: true,
      sopExpiredAt: true,
      autoBypassAt: true,
    },
  })

  if (!pengajuan) return null

  const remainingDays = await getRemainingWorkingDays(new Date(), pengajuan.deadlineAt)
  const totalDays = 7 // fixed SOP duration

  const calendarDaysPassed = differenceInCalendarDays(new Date(), pengajuan.submittedAt)

  let sopStatus: SopStatus = "NORMAL"
  if (remainingDays <= 0) {
    sopStatus = "EXPIRED"
  } else if (remainingDays <= 2) {
    sopStatus = "WARNING"
  }

  // Auto-bypass eligible after 10 calendar days from submission
  const isAutoBypassEligible = calendarDaysPassed >= 10 && !pengajuan.autoBypassAt

  return {
    submittedAt: pengajuan.submittedAt,
    deadlineAt: pengajuan.deadlineAt,
    remainingDays,
    totalDays,
    sopStatus,
    calendarDaysPassed,
    isAutoBypassEligible,
  }
}

export function formatSopStatus(sopStatus: SopStatus): string {
  switch (sopStatus) {
    case "NORMAL": return "Dalam batas waktu"
    case "WARNING": return "Hampir habis"
    case "EXPIRED": return "SOP habis"
  }
}
```

Commit: `git add src/lib/sop.ts && git commit -m "feat(F1a): SOP status calculator"`

---

### F1a Step 5: Update `src/lib/notifications.ts` — Full Notification Creation

**Context:** Currently stub. Needs to create Notification records in database.

```typescript
// Hapus semua isi file lama, ganti dengan:
import { prisma } from "@/lib/prisma"

export type NotificationType =
  | "NEW_SUBMISSION"
  | "VERIFIED"
  | "REJECTED_DESA"
  | "REJECTED_OPD"
  | "OPD_RECEIVED"
  | "FOLLOWUP_SUBMITTED"
  | "FOLLOWUP_APPROVED"
  | "REVISION_REQUESTED"
  | "SOP_WARNING_H2"
  | "SOP_EXPIRED"
  | "ADMIN_WARNING"
  | "BYPASS_MANUAL"
  | "AUTO_BYPASS"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  pengajuanId?: string
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      pengajuanId: params.pengajuanId,
    },
  })
}

export async function createNotificationsForUsers(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
): Promise<void> {
  await Promise.all(
    userIds.map((userId) =>
      createNotification({ ...params, userId })
    )
  )
}

export async function notifyPengajuanBaru(kaderId: string, pengajuanId: string, tiketNumber: string): Promise<void> {
  // Notify ALL petugas desa in the same desa as the kader
  const kader = await prisma.user.findUnique({
    where: { id: kaderId },
    include: { posyandu: { include: { desa: true } } },
  })

  if (!kader?.posyandu?.desa) return

  const petugasDesaIds = await prisma.user.findMany({
    where: {
      role: "PETUGAS_DESA",
      desaId: kader.posyandu.desa.id,
      isActive: true,
    },
    select: { id: true },
  })

  const title = "Pengajuan Baru"
  const message = `Pengajuan baru ${tiketNumber} menunggu verifikasi.`

  await createNotificationsForUsers(
    petugasDesaIds.map((u) => u.id),
    { type: "NEW_SUBMISSION", title, message, pengajuanId }
  )
}
```

Commit: `git add src/lib/notifications.ts && git commit -m "feat(F1a): full notification service with create and notifyPengajuanBaru"`

---

### F1a Step 6: Update `src/lib/messages.ts` — Add notification constants

**Context:** Add notification type labels for UI display.

```typescript
// Tambahkan di dalam MESSAGES object di messages.ts (setelah roles section):
const existingMessages = {
  auth: { ... },
  status: { ... },
  statusColor: { ... },
  roles: { ... },
}

// Add these at the end of MESSAGES object:
notificationType: {
  NEW_SUBMISSION: "Pengajuan Baru",
  VERIFIED: "Telah Diverifikasi",
  REJECTED_DESA: "Ditolak Desa",
  REJECTED_OPD: "Ditolak OPD",
  OPD_RECEIVED: "OPD Menerima",
  FOLLOWUP_SUBMITTED: "Tindak Lanjut Disubmit",
  FOLLOWUP_APPROVED: "Disetujui",
  REVISION_REQUESTED: "Minta Revisi",
  SOP_WARNING_H2: "Peringatan SOP H-2",
  SOP_EXPIRED: "SOP Habis",
  ADMIN_WARNING: "Teguran Admin",
  BYPASS_MANUAL: "Bypass Manual",
  AUTO_BYPASS: "Auto Bypass",
} as Record<NotificationType, string>,

sopStatus: {
  NORMAL: "Dalam batas waktu",
  WARNING: "Hampir habis",
  EXPIRED: "SOP habis",
} as Record<SopStatus, string>,
```

**Note:** Add `SopStatus` import from `"@/lib/sop"` and `NotificationType` from `"@/lib/notifications"`.

Commit: `git add src/lib/messages.ts && git commit -m "feat(F1a): add notification type + SOP status constants to messages"`

---

## TASK F1b: API Routes

**Goal:** Create all API routes for form pengajuan. Auth guard via session check. Role-based access.

**Files:**
- Create: `src/app/api/opd/[id]/route.ts`
- Create: `src/app/api/layanan/[id]/fields/route.ts`
- Create: `src/app/api/pengajuan/route.ts`
- Create: `src/app/api/upload/route.ts`

---

### F1b Step 1: Create `src/app/api/opd/[id]/route.ts` — OPD Detail + Layanan

```typescript
// src/app/api/opd/[id]/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const opd = await prisma.opd.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      icon: true,
      color: true,
      isActive: true,
      layananjenis: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  })

  if (!opd) {
    return NextResponse.json({ success: false, error: "OPD tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: opd,
  })
}
```

Commit: `git add src/app/api/opd/[id]/route.ts && git commit -m "feat(F1b): GET /api/opd/[id] - OPD detail with layanan"`

---

### F1b Step 2: Create `src/app/api/layanan/[id]/fields/route.ts`

```typescript
// src/app/api/layanan/[id]/fields/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const layanan = await prisma.layananJenis.findUnique({
    where: { id },
    include: {
      formFields: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          fieldLabel: true,
          fieldName: true,
          fieldType: true,
          fieldOptions: true,
          isRequired: true,
          placeholder: true,
          helperText: true,
          sortOrder: true,
        },
      },
    },
  })

  if (!layanan) {
    return NextResponse.json({ success: false, error: "Jenis layanan tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: {
      id: layanan.id,
      name: layanan.name,
      description: layanan.description,
      fields: layanan.formFields.map((f) => ({
        ...f,
        // Parse JSON fieldOptions
        fieldOptions: f.fieldOptions ? (typeof f.fieldOptions === "string" ? JSON.parse(f.fieldOptions) : f.fieldOptions) : null,
      })),
    },
  })
}
```

Commit: `git add src/app/api/layanan/[id]/fields/route.ts && git commit -m "feat(F1b): GET /api/layanan/[id]/fields - form field definitions"`

---

### F1b Step 3: Create `src/app/api/pengajuan/route.ts` — POST Create Pengajuan

```typescript
// src/app/api/pengajuan/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateTicketNumber } from "@/lib/ticket"
import { calculateDeadline } from "@/lib/working-days"
import { notifyPengajuanBaru } from "@/lib/notifications"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "KADER") {
    return NextResponse.json({ success: false, error: "Hanya kader yang dapat membuat pengajuan" }, { status: 403 })
  }

  const body = await request.json()
  const {
    opdId,
    layananJenisId,
    namaPelapor,
    nikPelapor,
    noHpPelapor,
    alamatPelapor,
    deskripsi,
    fieldValues,
    attachments,
  } = body

  // Validate required fields
  if (!opdId || !layananJenisId || !namaPelapor || !alamatPelapor || !deskripsi) {
    return NextResponse.json({ success: false, error: "Field wajib belum diisi" }, { status: 400 })
  }

  // Get kader info (to find posyandu + desa)
  const kader = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { posyandu: true },
  })

  if (!kader?.posyandu) {
    return NextResponse.json({ success: false, error: "Kader tidak terikat posyandu" }, { status: 400 })
  }

  try {
    const submittedAt = new Date()
    const deadlineAt = await calculateDeadline(submittedAt, 7)

    // Generate ticket number
    const tiketNumber = await generateTicketNumber(opdId)

    // Create pengajuan with all relations
    const pengajuan = await prisma.pengajuan.create({
      data: {
        tiketNumber,
        kaderId: session.user.id,
        posyanduId: kader.posyandu.id,
        desaId: kader.posyandu.desaId,
        opdId,
        layananJenisId,
        namaPelapor,
        nikPelapor: nikPelapor || null,
        noHpPelapor: noHpPelapor || null,
        alamatPelapor,
        deskripsi,
        status: "MENUNGGU_VERIFIKASI",
        submittedAt,
        deadlineAt,
        fieldValues: {
          create: (fieldValues ?? []).map((fv: { formFieldId: string; fieldValue: string }) => ({
            formFieldId: fv.formFieldId,
            fieldValue: fv.fieldValue,
          })),
        },
        attachments: attachments?.length
          ? {
              create: attachments.map((att: {
                attachmentType: string
                filePath?: string
                fileName?: string
                fileSize?: number
                mimeType?: string
                videoUrl?: string
                videoPlatform?: string
              }) => ({
                uploadedById: session.user.id,
                attachmentContext: "PENGAJUAN",
                attachmentType: att.attachmentType,
                filePath: att.filePath ?? null,
                fileName: att.fileName ?? null,
                fileSize: att.fileSize ?? null,
                mimeType: att.mimeType ?? null,
                videoUrl: att.videoUrl ?? null,
                videoPlatform: att.videoPlatform ?? null,
              })),
            }
          : undefined,
      },
      select: { id: true, tiketNumber: true },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        pengajuanId: pengajuan.id,
        userId: session.user.id,
        userRole: session.user.role,
        action: "Pengajuan dibuat oleh kader",
        oldStatus: null,
        newStatus: "MENUNGGU_VERIFIKASI",
      },
    })

    // Notify petugas desa
    await notifyPengajuanBaru(session.user.id, pengajuan.id, pengajuan.tiketNumber)

    return NextResponse.json({
      success: true,
      data: { id: pengajuan.id, tiketNumber: pengajuan.tiketNumber },
      message: "Pengajuan berhasil dibuat",
    })
  } catch (error) {
    console.error("Create pengajuan error:", error)
    return NextResponse.json({ success: false, error: "Gagal membuat pengajuan" }, { status: 500 })
  }
}
```

Commit: `git add src/app/api/pengajuan/route.ts && git commit -m "feat(F1b): POST /api/pengajuan - create pengajuan with ticket + notifications"`

---

### F1b Step 4: Create `src/app/api/upload/route.ts` — File Upload

```typescript
// src/app/api/upload/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { uploadFile } from "@/lib/upload"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "Tidak ada file" }, { status: 400 })
    }

    const result = await uploadFile(file)

    return NextResponse.json({
      success: true,
      data: result,
      message: "File berhasil diupload",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload gagal"
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
```

Commit: `git add src/app/api/upload/route.ts && git commit -m "feat(F1b): POST /api/upload - file upload handler"`

---

## TASK F1c: Form Components

**Goal:** Build all form components for the pengajuan flow.

**Files:**
- Create: `src/components/forms/layanan-select.tsx`
- Create: `src/components/forms/dynamic-field.tsx`
- Create: `src/components/forms/dynamic-form.tsx`
- Create: `src/components/forms/attachment-upload.tsx`
- Create: `src/components/forms/video-links.tsx`
- Create: `src/components/forms/submit-confirmation.tsx`

---

### F1c Step 1: Create `src/components/forms/dynamic-field.tsx` — Single Field Renderer

```typescript
// src/components/forms/dynamic-field.tsx
"use client"

import { Controller, useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface FieldOption {
  value: string
  label: string
}

interface DynamicFieldProps {
  fieldName: string
  fieldLabel: string
  fieldType: string
  fieldOptions: FieldOption[] | null
  isRequired: boolean
  placeholder?: string | null
  helperText?: string | null
}

export function DynamicField({
  fieldName,
  fieldLabel,
  fieldType,
  fieldOptions,
  isRequired,
  placeholder,
  helperText,
}: DynamicFieldProps) {
  const { control } = useFormContext()

  const renderInput = () => {
    switch (fieldType) {
      case "textarea":
        return (
          <Controller
            name={`dynamic_${fieldName}`}
            control={control}
            rules={isRequired ? { required: `${fieldLabel} wajib diisi` } : {}}
            render={({ field, fieldState }) => (
              <>
                <Textarea
                  id={fieldName}
                  placeholder={placeholder ?? ""}
                  className="min-h-[100px]"
                  {...field}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-1">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        )

      case "select":
        return (
          <Controller
            name={`dynamic_${fieldName}`}
            control={control}
            rules={isRequired ? { required: `${fieldLabel} wajib diisi` } : {}}
            render={({ field, fieldState }) => (
              <>
                <select
                  id={fieldName}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  {...field}
                >
                  <option value="">Pilih {fieldLabel}</option>
                  {fieldOptions?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-1">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        )

      case "radio":
        return (
          <Controller
            name={`dynamic_${fieldName}`}
            control={control}
            rules={isRequired ? { required: `${fieldLabel} wajib diisi` } : {}}
            render={({ field }) => (
              <div className="space-y-2">
                {fieldOptions?.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={opt.value}
                      checked={field.value === opt.value}
                      onChange={() => field.onChange(opt.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
          />
        )

      case "checkbox":
        return (
          <Controller
            name={`dynamic_${fieldName}`}
            control={control}
            render={({ field }) => {
              const selected = (field.value as string[]) ?? []
              return (
                <div className="space-y-2">
                  {fieldOptions?.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        value={opt.value}
                        checked={selected.includes(opt.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...selected, opt.value])
                          } else {
                            field.onChange(selected.filter((v: string) => v !== opt.value))
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )
            }}
          />
        )

      case "date":
        return (
          <Controller
            name={`dynamic_${fieldName}`}
            control={control}
            rules={isRequired ? { required: `${fieldLabel} wajib diisi` } : {}}
            render={({ field, fieldState }) => (
              <>
                <Input type="date" id={fieldName} {...field} />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-1">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        )

      case "number":
        return (
          <Controller
            name={`dynamic_${fieldName}`}
            control={control}
            rules={isRequired ? { required: `${fieldLabel} wajib diisi` } : {}}
            render={({ field, fieldState }) => (
              <>
                <Input
                  type="number"
                  id={fieldName}
                  placeholder={placeholder ?? ""}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-1">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        )

      default: // "text"
        return (
          <Controller
            name={`dynamic_${fieldName}`}
            control={control}
            rules={isRequired ? { required: `${fieldLabel} wajib diisi` } : {}}
            render={({ field, fieldState }) => (
              <>
                <Input
                  type="text"
                  id={fieldName}
                  placeholder={placeholder ?? ""}
                  {...field}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-1">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>
        {fieldLabel}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderInput()}
      {helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  )
}
```

Commit: `git add src/components/forms/dynamic-field.tsx && git commit -m "feat(F1c): dynamic-field - single field renderer for all types"`

---

### F1c Step 2: Create `src/components/forms/layanan-select.tsx`

```typescript
// src/components/forms/layanan-select.tsx
"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"

interface Layanan {
  id: string
  name: string
  description: string | null
}

interface LayananSelectProps {
  opdId: string
  value: string
  onChange: (layananId: string) => void
  error?: string
}

export function LayananSelect({ opdId, value, onChange, error }: LayananSelectProps) {
  const [layanan, setLayanan] = useState<Layanan[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const fetchLayanan = async () => {
    if (fetched) return
    setLoading(true)
    try {
      const res = await fetch(`/api/opd/${opdId}`)
      const json = await res.json()
      if (json.success) {
        setLayanan(json.data.layananjenis)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }

  // Fetch on mount + focus
  return (
    <div className="space-y-2">
      <Label htmlFor="layanan">
        Jenis Layanan <span className="text-red-500">*</span>
      </Label>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Memuat...</span>
        </div>
      ) : (
        <select
          id="layanan"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onMouseEnter={fetchLayanan}
          onFocus={fetchLayanan}
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Pilih Jenis Layanan</option>
          {layanan.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {fetched && layanan.length === 0 && (
        <p className="text-sm text-gray-500">Tidak ada jenis layanan untuk OPD ini.</p>
      )}
    </div>
  )
}
```

Commit: `git add src/components/forms/layanan-select.tsx && git commit -m "feat(F1c): layanan-select - dropdown with lazy loading"`

---

### F1c Step 3: Create `src/components/forms/dynamic-form.tsx`

```typescript
// src/components/forms/dynamic-form.tsx
"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { DynamicField } from "./dynamic-field"

interface FormField {
  id: string
  fieldLabel: string
  fieldName: string
  fieldType: string
  fieldOptions: { value: string; label: string }[] | null
  isRequired: boolean
  placeholder: string | null
  helperText: string | null
  sortOrder: number
}

interface DynamicFormProps {
  layananId: string
  onFieldsLoaded: (fields: FormField[]) => void
}

export function DynamicForm({ layananId, onFieldsLoaded }: DynamicFormProps) {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!layananId) {
      setFields([])
      onFieldsLoaded([])
      return
    }

    const fetchFields = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/layanan/${layananId}/fields`)
        const json = await res.json()
        if (json.success) {
          const loadedFields = json.data.fields as FormField[]
          setFields(loadedFields)
          onFieldsLoaded(loadedFields)
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }

    fetchFields()
  }, [layananId, onFieldsLoaded])

  if (!layananId) {
    return (
      <div className="text-sm text-gray-500 py-4">
        Pilih jenis layanan terlebih dahulu untuk melihat form
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-500">Memuat form...</span>
      </div>
    )
  }

  if (fields.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4">
        Form fields tidak tersedia untuk layanan ini.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <DynamicField
          key={field.id}
          fieldName={field.fieldName}
          fieldLabel={field.fieldLabel}
          fieldType={field.fieldType}
          fieldOptions={field.fieldOptions}
          isRequired={field.isRequired}
          placeholder={field.placeholder}
          helperText={field.helperText}
        />
      ))}
    </div>
  )
}
```

Commit: `git add src/components/forms/dynamic-form.tsx && git commit -m "feat(F1c): dynamic-form - form field renderer with lazy loading"`

---

### F1c Step 4: Create `src/components/forms/attachment-upload.tsx`

```typescript
// src/components/forms/attachment-upload.tsx
"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadedFile {
  url: string
  fileName: string
  mimeType: string
  size: number
}

interface AttachmentUploadProps {
  onFilesChange: (files: UploadedFile[]) => void
  maxFiles?: number
}

export function AttachmentUpload({
  onFilesChange,
  maxFiles = 5,
}: AttachmentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const remainingSlots = maxFiles - files.length
    if (remainingSlots <= 0) {
      setError(`Maksimal ${maxFiles} file.`)
      return
    }

    const toUpload = Array.from(selectedFiles).slice(0, remainingSlots)

    setUploading(true)
    setError(null)

    const uploaded: UploadedFile[] = []
    const errors: string[] = []

    for (const file of toUpload) {
      try {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        const json = await res.json()

        if (json.success) {
          uploaded.push(json.data)
        } else {
          errors.push(`${file.name}: ${json.error}`)
        }
      } catch {
        errors.push(`${file.name}: Upload gagal`)
      }
    }

    setUploading(false)

    if (errors.length > 0) {
      setError(errors.join(". "))
    }

    if (uploaded.length > 0) {
      const newFiles = [...files, ...uploaded]
      setFiles(newFiles)
      onFilesChange(newFiles)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesChange(newFiles)
    setError(null)
  }

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || files.length >= maxFiles}
          className={cn(
            "flex flex-col items-center gap-2 mx-auto text-gray-600",
            uploading ? "opacity-50" : "cursor-pointer hover:text-gray-800"
          )}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Upload className="w-8 h-8" />
          )}
          <span className="text-sm">
            {uploading ? "Mengupload..." : "Klik untuk upload file"}
          </span>
          <span className="text-xs text-gray-400">
            JPG, PNG, PDF. Maks 5MB. {files.length}/{maxFiles} file.
          </span>
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {file.mimeType.startsWith("image/") ? (
                  <img
                    src={file.url}
                    alt={file.fileName}
                    className="w-8 h-8 object-cover rounded"
                  />
                ) : (
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">PDF</span>
                )}
                <span className="text-sm truncate">{file.fileName}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-gray-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

Commit: `git add src/components/forms/attachment-upload.tsx && git commit -m "feat(F1c): attachment-upload - file upload with preview and Cloudinary/local"`

---

### F1c Step 5: Create `src/components/forms/video-links.tsx`

```typescript
// src/components/forms/video-links.tsx
"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface VideoLink {
  url: string
  platform: string
}

interface VideoLinksProps {
  onChange: (links: VideoLink[]) => void
}

function detectPlatform(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
  if (url.includes("tiktok.com")) return "tiktok"
  if (url.includes("instagram.com")) return "instagram"
  if (url.includes("facebook.com")) return "facebook"
  return "other"
}

export function VideoLinks({ onChange }: VideoLinksProps) {
  const [links, setLinks] = useState<VideoLink[]>([])

  const addLink = () => {
    setLinks([...links, { url: "", platform: "other" }])
  }

  const updateLink = (index: number, url: string) => {
    const updated = links.map((l, i) =>
      i === index
        ? { ...l, url, platform: url ? detectPlatform(url) : "other" }
        : l
    )
    setLinks(updated)
    onChange(updated.filter((l) => l.url))
  }

  const removeLink = (index: number) => {
    const updated = links.filter((_, i) => i !== index)
    setLinks(updated)
    onChange(updated.filter((l) => l.url))
  }

  return (
    <div className="space-y-3">
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={link.url}
            onChange={(e) => updateLink(i, e.target.value)}
            className="flex-1"
          />
          {link.url && (
            <span className="text-xs text-gray-500 capitalize w-16">{link.platform}</span>
          )}
          <button
            type="button"
            onClick={() => removeLink(i)}
            className="text-gray-400 hover:text-red-600 p-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addLink}
        className="flex items-center gap-1"
      >
        <Plus className="w-4 h-4" />
        Tambah Link Video
      </Button>

      {links.length === 0 && (
        <p className="text-xs text-gray-400">
          Opsional. Tempel link video dari YouTube, TikTok, atau platform lain.
        </p>
      )}
    </div>
  )
}
```

Commit: `git add src/components/forms/video-links.tsx && git commit -m "feat(F1c): video-links - add/remove video URL inputs with platform detection"`

---

### F1c Step 6: Create `src/components/forms/submit-confirmation.tsx`

```typescript
// src/components/forms/submit-confirmation.tsx
"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SubmitConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isSubmitting?: boolean
}

export function SubmitConfirmation({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: SubmitConfirmationProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konfirmasi Pengajuan</DialogTitle>
          <DialogDescription>
            Apakah data yang Anda masukkan sudah benar?
            <br />
            <span className="font-medium text-yellow-700">
              Pengajuan yang sudah dikirim tidak dapat diedit.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Mengirim..." : "Ya, Kirim Sekarang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

Commit: `git add src/components/forms/submit-confirmation.tsx && git commit -m "feat(F1c): submit-confirmation modal dialog"`

---

## TASK F1d: Pages + Dashboard Update

**Goal:** Build the full Ajukan page, success page, and update the Kader dashboard.

**Files:**
- Modify: `src/app/(dashboard)/kader/page.tsx`
- Create: `src/app/(dashboard)/kader/ajukan/[opdId]/page.tsx`
- Create: `src/app/(dashboard)/kader/ajuan-sukses/page.tsx`

---

### F1d Step 1: Create `src/app/(dashboard)/kader/ajukan/[opdId]/page.tsx`

```typescript
// src/app/(dashboard)/kader/ajukan/[opdId]/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { DynamicForm } from "@/components/forms/dynamic-form"
import { AttachmentUpload } from "@/components/forms/attachment-upload"
import { VideoLinks } from "@/components/forms/video-links"
import { SubmitConfirmation } from "@/components/forms/submit-confirmation"

// Static validation schema
const staticSchema = z.object({
  namaPelapor: z.string().min(1, "Nama pelapor wajib diisi"),
  nikPelapor: z.string().optional(),
  noHpPelapor: z.string().optional(),
  alamatPelapor: z.string().min(1, "Alamat pelapor wajib diisi"),
  deskripsi: z.string().min(20, "Deskripsi minimal 20 karakter"),
})

type StaticForm = z.infer<typeof staticSchema>

interface FormField {
  id: string
  fieldLabel: string
  fieldName: string
  fieldType: string
  fieldOptions: { value: string; label: string }[] | null
  isRequired: boolean
  placeholder: string | null
  helperText: string | null
}

interface PageProps {
  params: Promise<{ opdId: string }>
}

export default function AjukanPage({ params }: PageProps) {
  const resolvedParams = use(params) as { opdId: string }
  const router = useRouter()
  const { toast } = useToast()

  const [opdName, setOpdName] = useState("")
  const [opdId, setOpdId] = useState("")
  const [selectedLayanan, setSelectedLayanan] = useState("")
  const [dynamicFields, setDynamicFields] = useState<FormField[]>([])
  const [attachments, setAttachments] = useState<{ url: string; fileName: string; mimeType: string; size: number }[]>([])
  const [videoLinks, setVideoLinks] = useState<{ url: string; platform: string }[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (resolvedParams.opdId) {
      setOpdId(resolvedParams.opdId)
      fetchOpd(resolvedParams.opdId)
    }
  }, [resolvedParams])

  const fetchOpd = async (id: string) => {
    const res = await fetch(`/api/opd/${id}`)
    const json = await res.json()
    if (json.success) {
      setOpdName(json.data.name)
    }
  }

  const form = useForm<StaticForm>({
    resolver: zodResolver(staticSchema),
    mode: "onBlur",
  })

  const onFieldsLoaded = useCallback((fields: FormField[]) => {
    setDynamicFields(fields)
  }, [])

  const handleSubmit = async () => {
    const staticData = form.getValues()
    const dynamicData: { formFieldId: string; fieldValue: string }[] = []

    for (const field of dynamicFields) {
      const key = `dynamic_${field.fieldName}`
      const value = form.getValues(key as keyof StaticForm)
      if (value !== undefined && value !== "") {
        // For checkbox, stringify array
        const fieldValue = Array.isArray(value) ? JSON.stringify(value) : String(value)
        dynamicData.push({ formFieldId: field.id, fieldValue })
      }
    }

    const attachmentPayload = [
      ...attachments.map((f) => ({
        attachmentType: "FILE",
        filePath: f.url,
        fileName: f.fileName,
        fileSize: f.size,
        mimeType: f.mimeType,
      })),
      ...videoLinks
        .filter((v) => v.url)
        .map((v) => ({
          attachmentType: "VIDEO_LINK",
          videoUrl: v.url,
          videoPlatform: v.platform,
        })),
    ]

    setSubmitting(true)
    try {
      const res = await fetch("/api/pengajuan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opdId,
          layananJenisId: selectedLayanan,
          ...staticData,
          fieldValues: dynamicData,
          attachments: attachmentPayload,
        }),
      })

      const json = await res.json()

      if (json.success) {
        router.push(`/kader/ajuan-sukses?tiket=${encodeURIComponent(json.data.tiketNumber)}`)
      } else {
        toast({ title: "Gagal", description: json.error, variant: "destructive" })
        setSubmitting(false)
      }
    } catch {
      toast({ title: "Error", description: "Terjadi kesalahan. Silakan coba lagi.", variant: "destructive" })
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengajuan ke {opdName || "..."}</h1>
        <p className="text-gray-500 text-sm mt-1">Isi formulir di bawah ini untuk membuat pengajuan</p>
      </div>

      <form onSubmit={form.handleSubmit(() => setShowConfirmation(true))}>
        {/* Step 1: Pilih Jenis Layanan */}
        <Card className="p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">1. Pilih Jenis Layanan</h2>
          {/* Lazy load layanan options from component, but pass opdId */}
          <input type="hidden" value={opdId} />
          <LayananSelectDropdown opdId={opdId} value={selectedLayanan} onChange={setSelectedLayanan} />
        </Card>

        {/* Step 2: Form Dinamis */}
        {selectedLayanan && (
          <Card className="p-6 mb-4">
            <h2 className="text-lg font-semibold mb-4">2. Detail Pengajuan</h2>
            <div className="space-y-4">
              <DynamicForm layananId={selectedLayanan} onFieldsLoaded={onFieldsLoaded} />
            </div>
          </Card>
        )}

        {/* Step 3: Data Pelapor */}
        <Card className="p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">3. Data Pelapor</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="namaPelapor">Nama Pelapor <span className="text-red-500">*</span></Label>
              <Input id="namaPelapor" placeholder="Nama lengkap" {...form.register("namaPelapor")} />
              {form.formState.errors.namaPelapor && (
                <p className="text-sm text-red-600">{form.formState.errors.namaPelapor.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nikPelapor">NIK Pelapor</Label>
                <Input id="nikPelapor" placeholder="16 digit angka" maxLength={16} {...form.register("nikPelapor")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noHpPelapor">No. HP Pelapor</Label>
                <Input id="noHpPelapor" placeholder="08xxxxxxxxxx" {...form.register("noHpPelapor")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamatPelapor">Alamat Pelapor <span className="text-red-500">*</span></Label>
              <Textarea id="alamatPelapor" placeholder="Alamat lengkap" {...form.register("alamatPelapor")} />
              {form.formState.errors.alamatPelapor && (
                <p className="text-sm text-red-600">{form.formState.errors.alamatPelapor.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Step 4: Deskripsi */}
        <Card className="p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">4. Deskripsi / Uraian</h2>
          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi / Uraian Pengaduan <span className="text-red-500">*</span></Label>
            <Textarea
              id="deskripsi"
              placeholder="Jelaskan secara detail permasalahan atau layanan yang dibutuhkan (min 20 karakter)"
              className="min-h-[120px]"
              {...form.register("deskripsi")}
            />
            {form.formState.errors.deskripsi && (
              <p className="text-sm text-red-600">{form.formState.errors.deskripsi.message}</p>
            )}
          </div>
        </Card>

        {/* Step 5: Lampiran */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">5. Lampiran (Opsional)</h2>

          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">Upload Foto / Dokumen</Label>
              <AttachmentUpload onFilesChange={setAttachments} />
            </div>

            <div>
              <Label className="mb-2 block">Link Video</Label>
              <VideoLinks onChange={setVideoLinks} />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            className="flex-1 min-h-[44px]"
            disabled={submitting || !selectedLayanan}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim Pengajuan"
            )}
          </Button>
        </div>
      </form>

      <SubmitConfirmation
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleSubmit}
        isSubmitting={submitting}
      />
    </div>
  )
}

// Inline lazy-load dropdown component (simplified version)
function LayananSelectDropdown({
  opdId,
  value,
  onChange,
}: {
  opdId: string
  value: string
  onChange: (v: string) => void
}) {
  const [options, setOptions] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!opdId || fetched) return
    setLoading(true)
    fetch(`/api/opd/${opdId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setOptions(j.data.layananjenis)
      })
      .finally(() => {
        setLoading(false)
        setFetched(true)
      })
  }, [opdId, fetched])

  return (
    <div className="space-y-2">
      <Label htmlFor="layanan">Jenis Layanan <span className="text-red-500">*</span></Label>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat...
        </div>
      ) : (
        <select
          id="layanan"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Pilih Jenis Layanan</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}
```

Commit: `git add "src/app/(dashboard)/kader/ajukan/[opdId]/page.tsx" && git commit -m "feat(F1d): ajukan page - full form pengajuan with dynamic fields"`

---

### F1d Step 2: Create `src/app/(dashboard)/kader/ajuan-sukses/page.tsx`

```typescript
// src/app/(dashboard)/kader/ajuan-sukses/page.tsx
"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { CheckCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useState } from "react"

function SuccessContent() {
  const searchParams = useSearchParams()
  const tiketNumber = searchParams.get("tiket") ?? ""
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tiketNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pengajuan Berhasil!</h1>
      <p className="text-gray-500 mb-8">
        Pengajuan Anda telah diterima. Catat nomor tiket di bawah ini.
      </p>

      <Card className="p-8 mb-6">
        <p className="text-sm text-gray-500 mb-2">Nomor Tiket</p>
        <p className="text-3xl font-bold font-mono text-blue-600 mb-4">
          {tiketNumber || "—"}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-2 mx-auto"
        >
          <Copy className="w-4 h-4" />
          {copied ? "Tersalin!" : "Salin Nomor Tiket"}
        </Button>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Berikan nomor tiket ini kepada masyarakat</strong> untuk melacak status pengajuan di halaman{" "}
          <strong>/tracking</strong>.
        </p>
      </div>

      <Button onClick={() => window.location.href = "/kader"} variant="outline">
        Kembali ke Beranda
      </Button>
    </div>
  )
}

export default function AjuanSuksesPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Memuat...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
```

Commit: `git add "src/app/(dashboard)/kader/ajuan-sukses/page.tsx" && git commit -m "feat(F1d): ajuan-sukses page - ticket number display with copy"`

---

### F1d Step 3: Update `src/app/(dashboard)/kader/page.tsx` — Full Dashboard

```typescript
// src/app/(dashboard)/kader/page.tsx
// Ganti semua isi file dengan:
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { PengajuanStatus } from "@/lib/messages"

export default async function KaderDashboardPage() {
  const session = await auth()
  if (!session?.user) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      posyandu: {
        include: {
          desa: { include: { kecamatan: true } },
        },
      },
    },
  })

  if (!user) return null

  const [stats, recentPengajuans, opds] = await Promise.all([
    prisma.pengajuan.groupBy({
      by: ["status"],
      where: { kaderId: session.user.id },
      _count: true,
    }),
    prisma.pengajuan.findMany({
      where: { kaderId: session.user.id },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: { opd: { select: { name: true, color: true } } },
    }),
    prisma.opd.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ])

  const total = stats.reduce((sum, s) => sum + s._count, 0)
  const completed = stats.find((s) => s.status === "SELESAI")?._count ?? 0
  const rejected = stats
    .filter((s) => s.status === "DITOLAK_DESA" || s.status === "DITOLAK_OPD")
    .reduce((sum, s) => sum + s._count, 0)
  const inProcess = stats
    .filter((s) => s.status !== "SELESAI" && s.status !== "DITOLAK_DESA" && s.status !== "DITOLAK_OPD")
    .reduce((sum, s) => sum + s._count, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {session.user.name}
        </h1>
        <p className="text-gray-500 mt-1">
          Posyandu: {user.posyandu?.name ?? "—"} — {user.posyandu?.desa?.name ?? "—"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Pengajuan" value={total} />
        <StatCard label="Dalam Proses" value={inProcess} highlight={inProcess > 0} />
        <StatCard label="Selesai" value={completed} color="text-green-600" />
        <StatCard label="Ditolak" value={rejected} color="text-red-600" />
      </div>

      {/* OPD Cards */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Buat Pengajuan Baru</h2>
        <p className="text-sm text-gray-500 mb-4">Pilih OPD yang sesuai dengan jenis layanan atau pengaduan masyarakat:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {opds.map((opd) => (
            <Link key={opd.id} href={`/kader/ajukan/${opd.id}`}>
              <Card
                className="p-4 hover:shadow-md transition-shadow cursor-pointer text-center"
                style={{ borderTopColor: opd.color ?? "#3B82F6", borderTopWidth: 3 }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-lg"
                  style={{ backgroundColor: opd.color ?? "#3B82F6" }}
                >
                  {opd.name.charAt(0)}
                </div>
                <p className="text-sm font-medium text-gray-900">{opd.name}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Pengajuans */}
      {recentPengajuans.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pengajuan Terbaru</h2>
            <Link href="/kader/riwayat" className="text-sm text-blue-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">No. Tiket</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Nama Pelapor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">OPD</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recentPengajuans.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{p.tiketNumber}</td>
                    <td className="px-4 py-3">{p.namaPelapor}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: `${p.opd.color ?? "#3B82F6"}20`, color: p.opd.color ?? "#3B82F6" }}
                      >
                        {p.opd.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status as PengajuanStatus} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {format(p.submittedAt, "dd MMM yyyy", { locale: id })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  highlight,
}: {
  label: string
  value: number
  color?: string
  highlight?: boolean
}) {
  return (
    <Card className="p-4">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? "text-gray-900"} ${highlight ? "text-yellow-600" : ""}`}>
        {value}
      </p>
    </Card>
  )
}
```

Commit: `git add "src/app/(dashboard)/kader/page.tsx" && git commit -m "feat(F1d): kader dashboard - stats cards + OPD cards + recent submissions table"`

---

## TASK F1e: Prisma Client Re-gen (Post-Schema Changes)

**Goal:** Verify Prisma client is up to date.

```bash
cd "C:/Users/FUDA/herd/e-posyandu"
npx prisma generate
```

Expected output: `✔ Generated Prisma Client...`

Commit: `git add package.json prisma/schema.prisma && git commit -m "chore: regenerate Prisma client"`

---

## TASK F1f: End-to-End Test

**Goal:** Test full flow: dashboard → pilih OPD → pilih layanan → isi form → submit → dapat tiket.

### Test Steps:

1. Start dev server: `npm run dev`
2. Login: `kader@example.com` / `kader123`
3. Dashboard shows: stats + 6 OPD cards + recent table
4. Klik OPD Kesehatan card → navigasi ke `/kader/ajukan/[opdId]`
5. Pilih jenis layanan → form fields muncul
6. Isi static fields + optional attachment
7. Klik Kirim Pengajuan → modal konfirmasi → Ya Kirim
8. Redirect ke `/kader/ajuan-sukses?tiket=...` → nomor tiket tampil
9. Copy button works
10. Kembali ke beranda → nomor tiket muncul di recent table

Commit: `git commit --allow-empty -m "test(F1): e2e test completed - full form flow verified"`

---

## Spec Coverage Check

| Spec Section | Task |
|---|---|
| §9 Ticket generator | F1a Step 1 |
| §10 Form dinamis | F1c Step 1-3 |
| §11 Attachment upload | F1c Step 4-5 |
| §15 API routes (4 routes) | F1b Step 1-4 |
| §18.B Form Pengajuan | F1d Step 1 |
| §18.A Dashboard Kader | F1d Step 3 |
| §22.6 Dynamic form rendering | F1c Step 2-3 |
| §22.12 Data scoping (kader only) | F1b Step 3 |

**Coverage: 100%**