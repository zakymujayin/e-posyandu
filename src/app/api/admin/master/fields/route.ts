import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

const FIELD_TYPES = ["text", "textarea", "number", "date", "select", "radio", "checkbox"] as const

const schema = z.object({
  layananJenisId: z.string().min(1, "Layanan wajib dipilih"),
  fieldLabel: z.string().min(1, "Label wajib diisi"),
  fieldName: z.string().min(1, "Nama field wajib diisi").regex(/^[a-z_][a-z0-9_]*$/, "Nama field hanya huruf kecil, angka, dan underscore"),
  fieldType: z.enum(FIELD_TYPES),
  fieldOptions: z.string().optional().nullable(),
  isRequired: z.boolean().optional().default(false),
  placeholder: z.string().optional().nullable(),
  helperText: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
})

export async function GET(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { searchParams } = new URL(req.url)
  const layananId = searchParams.get("layananId")

  const fields = await prisma.formField.findMany({
    where: layananId ? { layananJenisId: layananId } : undefined,
    orderBy: [{ layananJenisId: "asc" }, { sortOrder: "asc" }],
    include: { layananJenis: { select: { name: true, opd: { select: { name: true } } } } },
  })
  return ok(fields)
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const layanan = await prisma.layananJenis.findUnique({ where: { id: parsed.data.layananJenisId } })
  if (!layanan) return err("Layanan tidak ditemukan")

  const field = await prisma.formField.create({ data: parsed.data })
  return ok(field, "Field berhasil ditambahkan")
}
