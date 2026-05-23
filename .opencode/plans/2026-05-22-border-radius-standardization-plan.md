# Border-Radius Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all border-radius across the e-Posyandu app to `rounded-lg` (12px) for formal/professional appearance.

**Architecture:** Fix 5 base components (button, data-table, dialog, card, badge) as single source of truth, then remove explicit radius overrides from 22 page/component files.

**Tech Stack:** Next.js + Tailwind CSS + shadcn/ui (base-nova style)

---

### Task 1: Fix base components

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/shared/data-table.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/badge.tsx`

- [x] **Read all 5 files** (already read above)

- [ ] **Step 2: button.tsx** — Remove radius overrides from size variants

In `src/components/ui/button.tsx`, change:
- `xs` size: `rounded-[min(var(--radius-md),10px)]` → remove (inherit `rounded-lg` from base)
- `sm` size: `rounded-[min(var(--radius-md),12px)]` → remove
- `icon-xs` size: `rounded-[min(var(--radius-md),10px)]` → remove
- `icon-sm` size: `rounded-[min(var(--radius-md),12px)]` → remove

- [ ] **Step 3: data-table.tsx** — Change wrapper radius

In `src/components/shared/data-table.tsx`, change `rounded-2xl` to `rounded-lg` on the outer wrapper div.

- [ ] **Step 4: dialog.tsx** — Change dialog radius

In `src/components/ui/dialog.tsx`:
- Change `DialogContent` base `rounded-xl` to `rounded-lg`
- Change `DialogFooter` `rounded-b-xl` to `rounded-b-lg`

- [ ] **Step 5: card.tsx** — Change card radius

In `src/components/ui/card.tsx`:
- Change `<Card>` div `rounded-3xl` to `rounded-lg`
- Change CardHeader `rounded-t-3xl` to `rounded-t-lg`
- Change CardFooter `rounded-b-3xl` to `rounded-b-lg`

- [ ] **Step 6: badge.tsx** — Change badge radius

In `src/components/ui/badge.tsx`:
- In the `cva` variants, change `rounded-4xl` to `rounded-lg`

### Task 2: Clean up dashboard pages (11 files)

**Files:**
- Modify: `src/app/(dashboard)/kecamatan/page.tsx`
- Modify: `src/app/(dashboard)/opd/page.tsx`
- Modify: `src/app/(dashboard)/petugas-desa/page.tsx`
- Modify: `src/app/(dashboard)/petugas-desa/verifikasi/[id]/page.tsx`
- Modify: `src/app/(dashboard)/kader/page.tsx`
- Modify: `src/app/(dashboard)/kader/riwayat/page.tsx`
- Modify: `src/app/(dashboard)/admin/page.tsx`
- Modify: `src/app/(dashboard)/admin/pengajuan/[id]/page.tsx`
- Modify: `src/app/(dashboard)/admin/laporan/page.tsx`
- Modify: `src/app/(dashboard)/opd/tindak-lanjut/[id]/page.tsx`
- Modify: `src/app/(dashboard)/kader/ajukan/[opdId]/page.tsx`

For each file, **read the file, then replace**:
- `rounded-2xl` → `rounded-lg` (on containers, wrappers, banners)
- `rounded-xl` → `rounded-lg` (on buttons, selects, items)
- `rounded-3xl` → `rounded-lg` (if any)

### Task 3: Clean up admin master components (5 files)

**Files:**
- Modify: `src/components/admin/master/fields-manager.tsx`
- Modify: `src/components/admin/master/layanan-manager.tsx`
- Modify: `src/components/admin/master/opd-manager.tsx`
- Modify: `src/components/admin/master/users-manager.tsx`
- Modify: `src/components/admin/master/wilayah-manager.tsx`

Same pattern: `rounded-xl` → `rounded-lg` on Buttons and selects.

### Task 4: Clean up action/form components (4 files)

**Files:**
- Modify: `src/components/admin/admin-actions.tsx`
- Modify: `src/components/petugas-desa/verifikasi-actions.tsx`
- Modify: `src/components/kader/pengajuan-form.tsx`
- Modify: `src/components/opd/tindak-lanjut-form.tsx`

Same pattern: `rounded-xl`/`rounded-2xl` → `rounded-lg`.

### Task 5: Clean up shared components (2 files)

**Files:**
- Modify: `src/components/shared/hero-welcome.tsx`
- Modify: `src/components/shared/pengajuan-detail.tsx`

Same pattern.

### Task 6: Build verification

- [ ] Run `npm run build` and fix any issues
- [ ] Quick visual log check for any radius-related warnings
