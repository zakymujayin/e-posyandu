# Border-Radius Standardization Design

**Date:** 2026-05-22
**Project:** e-Posyandu
**Goal:** Standardize border-radius across all UI components to `rounded-lg` (12px) for a more formal, professional appearance.

## Current State

The project currently has wildly inconsistent border-radius values:

| Element | Current Radius | Files Affected |
|---|---|---|
| `rounded-lg` (12px) | Base button, pengajuan-form buttons, sukses page | `button.tsx`, `pengajuan-form.tsx`, `sukses/page.tsx` |
| `rounded-xl` (~17px) | Dashboard button overrides, filter inputs, tab buttons, pagination buttons, dialog buttons | 15+ pages and components |
| `rounded-2xl` (~22px) | DataTable wrapper, tindak-lanjut main buttons, alert banners, filter/pagination containers, DialogContent overrides | `data-table.tsx`, `tindak-lanjut-form.tsx`, all dashboard pages |
| `rounded-3xl` (~26px) | Card component, HeroWelcome container | `card.tsx`, `hero-welcome.tsx` |
| `rounded-4xl` (~31px) | Badge component | `badge.tsx` |

## Target State

All elements standardized to **`rounded-lg` (12px)**.

## Changes

### Base Components (5 files — single source of truth)

1. **`src/components/ui/button.tsx`**
   - Remove `rounded-[min(var(--radius-md),10px)]` and `rounded-[min(var(--radius-md),12px)]` from xs/sm/icon-xs/icon-sm variants; let them inherit `rounded-lg` from base class

2. **`src/components/shared/data-table.tsx`**
   - Wrapper `<div>`: `rounded-2xl` → `rounded-lg`

3. **`src/components/ui/dialog.tsx`**
   - `DialogContent`: `rounded-xl` → `rounded-lg`
   - `DialogFooter`: `rounded-b-xl` → `rounded-b-lg`

4. **`src/components/ui/card.tsx`**
   - `<Card>`: `rounded-3xl` → `rounded-lg`
   - CardHeader: `rounded-t-3xl` → `rounded-t-lg`
   - CardFooter: `rounded-b-3xl` → `rounded-b-lg`

5. **`src/components/ui/badge.tsx`**
   - All variants: `rounded-4xl` → `rounded-lg`

### Page-Level Cleanup (22 files — remove radius overrides)

For each file below, remove ALL explicit `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-4xl` from Button, DialogContent, container divs, select/input elements, pagination wrappers, filter forms, tab bars, alert banners, cards, stat containers, and info sections.

#### Dashboard pages (9 files):
- `kecamatan/page.tsx` — error banner, filter form, select, Button, pagination wrapper
- `opd/page.tsx` — error banner, tab bar, Button
- `petugas-desa/page.tsx` — error banner, tab bar, Button
- `petugas-desa/verifikasi/[id]/page.tsx` — DialogContent, Button
- `kader/page.tsx` — service card Link, icon div
- `kader/riwayat/page.tsx` — filter wrapper, select, Button, pagination wrapper
- `admin/page.tsx` — alert box, alert item Link, select, Button, pagination wrapper
- `admin/pengajuan/[id]/page.tsx` — tindak lanjut section, riwayat items, DialogContent
- `admin/laporan/page.tsx` — stat card divs, comparison box, distribution boxes, table container
- `opd/tindak-lanjut/[id]/page.tsx` — riwayat section, riwayat items, banners
- `kader/ajukan/[opdId]/page.tsx` — error banner, side card icons, DialogContent

#### Admin master data components (5 files):
- `admin/master/fields-manager.tsx` — all Buttons, selects
- `admin/master/layanan-manager.tsx` — same
- `admin/master/opd-manager.tsx` — same
- `admin/master/users-manager.tsx` — same
- `admin/master/wilayah-manager.tsx` — same

#### Action/form components (4 files):
- `admin/admin-actions.tsx` — all Buttons, DialogContent
- `petugas-desa/verifikasi-actions.tsx` — Button, DialogContent
- `kader/pengajuan-form.tsx` — DialogContent, dialog Button
- `opd/tindak-lanjut-form.tsx` — upload area, Buttons, DialogContent, file items

#### Shared components (2 files):
- `shared/hero-welcome.tsx` — container, date widget
- `shared/pengajuan-detail.tsx` — info sections

## Verification

1. `npm run build` — ensure no TypeScript errors
2. Visual scan — all tables, buttons, dialogs, cards, badges use `rounded-lg`

## Rollback

`git checkout -- .` on the affected files if needed.
