# E-Posyandu Phase B — F1: Form Pengajuan Kader

**Status**: ✅ Desain Disetujui | 📋 Plan Dibuat | 🚧 Implementasi | ✅ Selesai

---

## Overview

Fase 1 dari implementasi Phase B E-Posyandu. Membangun form pengajuan lengkap untuk Kader Posyandu: pilih OPD → pilih layanan → isi form dinamis + static fields → upload lampiran → submit → dapat nomor tiket.

## Arsitektur Data & API

### Data Flow

```
1. Kader klik OPD card di dashboard
   → GET /api/opd/[opdId] → dapat nama OPD, layanan jenis options

2. Kader pilih jenis layanan
   → GET /api/layanan/[layananId]/fields → dapat form field definitions

3. Kader isi form + submit
   → POST /api/pengajuan → server: generate ticket, save, notify

4. Sukses
   → Redirect ke halaman sukses, tampilkan nomor tiket
```

### API Routes

| Method | Route | Responsibility | Auth |
|--------|-------|----------------|------|
| GET | `/api/opd/[id]` | Detail OPD + layanan options | KADER |
| GET | `/api/layanan/[id]/fields` | Form field definitions | KADER |
| POST | `/api/pengajuan` | Buat pengajuan baru | KADER |
| POST | `/api/upload` | Upload file (local/Cloudinary) | KADER |

### Request/Response

**POST /api/pengajuan**
```typescript
// Request body
{
  opdId: string
  layananJenisId: string
  // Static fields
  namaPelapor: string
  nikPelapor?: string
  noHpPelapor?: string
  alamatPelapor: string
  deskripsi: string
  // Dynamic fields
  fieldValues: Array<{ formFieldId: string; fieldValue: string }>
  // Attachments (uploaded URLs)
  attachments: Array<{
    attachmentType: "FILE" | "VIDEO_LINK"
    filePath?: string        // for FILE
    videoUrl?: string        // for VIDEO_LINK
    videoPlatform?: string
  }>
}

// Response
{
  success: true
  data: { id: string; tiketNumber: string }
  message: "Pengajuan berhasil dibuat"
}
```

### Ticket Generation

Atomic increment via Prisma transaction. Format: `{PREFIX}/{YEAR}/{5-DIGIT}`.

```typescript
// src/lib/ticket.ts
export async function generateTicketNumber(opdId: string): Promise<string>
```

Uses `TiketCounter` table with `lastSequence` increment per OPD per year.

## UI Components & State Management

### Page Structure

```
/kader/ajukan/[opdId]/
├── StepIndicator (1-Pilih Layanan, 2-Isi Form, 3-Konfirmasi)
├── LayananSelect (dropdown, loads from API)
├── DynamicFormRenderer (renders fields from form field definitions)
├── StaticFields (data pelapor + deskripsi — always visible)
├── AttachmentSection (file upload + video links — optional)
└── ConfirmationModal (confirm before submit)
```

### Component Inventory

| Component | File | Type | Description |
|-----------|------|------|-------------|
| LayananSelect | `src/components/forms/layanan-select.tsx` | Client | Dropdown pilih jenis layanan |
| DynamicFormRenderer | `src/components/forms/dynamic-form.tsx` | Client | Render fields dari FormField[] |
| DynamicField | `src/components/forms/dynamic-field.tsx` | Client | Single field (text/textarea/select/radio/checkbox) |
| AttachmentUpload | `src/components/forms/attachment-upload.tsx` | Client | File upload dengan preview |
| VideoLinks | `src/components/forms/video-links.tsx` | Client | Tambah/hapus link video |
| SubmitConfirmation | `src/components/forms/submit-confirmation.tsx` | Client | Modal konfirmasi submit |
| AjukanPage | `src/app/(dashboard)/kader/ajukan/[opdId]/page.tsx` | Server | Main page — loads OPD + layanan |
| SuccessPage | `src/app/(dashboard)/kader/ajuan-sukses/page.tsx` | Server | Displays ticket number |

### Form Fields Types

| Type | Input Component |
|------|----------------|
| `text` | Text input |
| `textarea` | Textarea |
| `number` | Number input |
| `date` | Date picker |
| `select` | Dropdown (from fieldOptions) |
| `radio` | Radio group |
| `checkbox` | Checkbox group (multi-select) |

### State Management

React Hook Form + Zod, single unified form. Schema built dynamically from `FormField[]` definitions.

```typescript
// Zod schema builder
const formSchema = buildZodSchema(formFields)
const form = useForm({ resolver: zodResolver(formSchema) })
```

### Form Steps (Progressive Disclosure)

**Step 1 — Pilih Jenis Layanan**
- Dropdown dengan options dari `/api/opd/[opdId]`
- Shows layanan description + expected fields
- Until selected: form fields hidden

**Step 2 — Isi Form**
- Dynamic fields based on selected layanan
- Static fields always visible (nama, NIK, HP, alamat, deskripsi)
- Attachment section (optional)

**Step 3 — Konfirmasi**
- Modal with summary
- "Data yang Anda masukkan sudah benar?"
- "Pengajuan yang sudah dikirim tidak dapat diedit."

### Submission Flow

```
1. User fills all fields
2. Clicks "Kirim Pengajuan"
3. → SubmitConfirmation modal opens
4. User clicks "Ya, Kirim Sekarang"
5. Client: upload files first via /api/upload → get URLs
6. Client: POST /api/pengajuan with all data + attachment URLs
7. Success:
   → Redirect /kader/ajuan-sukses?tiket={TiketNumber}
   → Display ticket number, copy button, "Kembali ke Beranda"
```

### Error Handling

| Error | Handling |
|-------|----------|
| Validation error | Inline field error (red text below input) |
| Network error | Toast error, form remains filled (not reset) |
| File too large | Client-side validation before upload, show error |
| Ticket generation fail | Retry 1x, then show error + "Coba lagi" button |

## File Upload Strategy

### Upload Abstraction Layer

`src/lib/upload.ts` — single interface, two adapters:

```typescript
// src/lib/upload.ts
interface UploadAdapter {
  upload(file: File): Promise<UploadResult>
}

// Dev: Local filesystem adapter
// Prod: Cloudinary adapter (when CLOUDINARY_* vars set)
```

### Development (Local)
- Files saved to `/public/uploads/` directory
- Returns path: `/uploads/filename.ext`
- Works for local testing

### Production (Vercel + Cloudinary)
- When `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` are set
- Adapter switches automatically
- No code changes needed

### Validation
- File types: JPG, JPEG, PNG, PDF
- Max size: 5MB per file
- Max files: 5 per pengajuan

## Library Updates

### src/lib/ticket.ts (Full Implementation)
- `generateTicketNumber(opdId: string): Promise<string>`
- Atomic increment via Prisma transaction
- Uses `TiketCounter` table

### src/lib/upload.ts (New)
- `uploadFile(file: File): Promise<UploadResult>`
- Auto-detect adapter (local vs Cloudinary)
- Validation (type + size)

### src/lib/working-days.ts (Full)
- `calculateDeadline(startDate: Date, workingDays: number): Promise<Date>`
- `getRemainingWorkingDays(startDate: Date, deadline: Date): Promise<number>`
- Check `PublicHoliday` table for national holidays

### src/lib/notifications.ts (Full)
- `createNotification(params): Promise<void>`
- Creates `Notification` record in database

## Dashboard Kader Updates

### /kader — Tambahan

Dashboard kader perlu dilengkapi dengan:

**Stats Cards** (4 cards):
- Total Pengajuan
- Dalam Proses
- Selesai
- Ditolak

**OPD Cards** (6 cards):
- Grid: 2 columns mobile, 3 tablet, 6 desktop
- Each card: icon, OPD name, description, color
- Click → navigasi ke `/kader/ajukan/[opdId]`
- Inactive OPD (`isActive = false`) hidden

**Pengajuan Terbaru** (list 5):
- Table with: Tiket#, Nama Pelapor, OPD, Status, Tanggal
- "Lihat Semua" link → `/kader/riwayat`

## Implementation Order

1. Update `src/lib/ticket.ts` — full ticket generator
2. Create `src/lib/upload.ts` — upload abstraction
3. Update `src/lib/notifications.ts` — full notification
4. Update `src/lib/working-days.ts` — full implementation
5. Create API routes: `/api/opd/[id]`, `/api/layanan/[id]/fields`, `/api/pengajuan`, `/api/upload`
6. Build form components: LayananSelect, DynamicForm, AttachmentUpload, VideoLinks
7. Build AjukanPage + SuccessPage
8. Update KaderDashboard (stats + OPD cards)
9. Test full flow: dashboard → pilih OPD → pilih layanan → isi form → submit → dapat tiket

## Files to Create/Modify

### New Files
- `src/lib/upload.ts`
- `src/lib/sop.ts`
- `src/components/forms/layanan-select.tsx`
- `src/components/forms/dynamic-form.tsx`
- `src/components/forms/dynamic-field.tsx`
- `src/components/forms/attachment-upload.tsx`
- `src/components/forms/video-links.tsx`
- `src/components/forms/submit-confirmation.tsx`
- `src/app/(dashboard)/kader/ajukan/[opdId]/page.tsx`
- `src/app/(dashboard)/kader/ajuan-sukses/page.tsx`
- `src/app/api/opd/[id]/route.ts`
- `src/app/api/layanan/[id]/fields/route.ts`
- `src/app/api/pengajuan/route.ts`
- `src/app/api/upload/route.ts`

### Modify Files
- `src/lib/ticket.ts` — stub → full implementation
- `src/lib/working-days.ts` — stub → full implementation
- `src/lib/notifications.ts` — stub → full implementation
- `src/app/(dashboard)/kader/page.tsx` — stub → full dashboard
- `src/app/(dashboard)/kader/riwayat/page.tsx` — basic list
- `src/app/(dashboard)/layout.tsx` — add loading skeleton

## Dependencies

- `papaparse` — for CSV (used in user import, not this phase)
- `date-fns` — for date manipulation in working-days
- No new dependencies needed

## Spec Coverage

| Docs Section | Coverage |
|-------------|----------|
| §8 Status Flow | ✅ Submit creates MENUNGGU_VERIFIKASI |
| §9 Sistem Tiket | ✅ Ticket generator with atomic increment |
| §10 Form Dinamis | ✅ DynamicFormRenderer from FormField[] |
| §11 Attachment | ✅ File upload + video links |
| §15 API Routes | ✅ All 4 routes implemented |
| §18.A Dashboard Kader | ✅ Stats + OPD cards + recent submissions |
| §18.B Form Pengajuan | ✅ Full form with confirmation flow |
| §22.6 Dynamic Form | ✅ Server fetch fields → client render |
| §22.12 Data Scoping | ✅ KADER only sees own submissions |