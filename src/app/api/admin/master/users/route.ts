import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { generateNoRegistrasi } from "@/lib/no-registrasi"

const ROLES = ["POSYANDU", "PETUGAS_DESA", "PETUGAS_KECAMATAN", "PETUGAS_OPD", "ADMIN_DPMD"] as const

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  username: z.string().min(3, "Username minimal 3 karakter").regex(/^[a-z0-9_]+$/, "Username hanya huruf kecil, angka, dan underscore"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(ROLES, { message: "Role tidak valid" }),
  desaId: z.string().optional().nullable(),
  kecamatanId: z.string().optional().nullable(),
  opdId: z.string().optional().nullable(),
  posyanduId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
})

export async function GET(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const { searchParams } = new URL(req.url)
  const role = searchParams.get("role")
  const search = searchParams.get("search")
  const isActive = searchParams.get("isActive")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10")))

  const where: Record<string, unknown> = {}
  if (role) where.role = role
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }]
  if (isActive === "true") where.isActive = true
  else if (isActive === "false") where.isActive = false

  const select = {
    id: true, name: true, email: true, username: true, role: true,
    isActive: true, createdAt: true, lastLoginAt: true,
    desaId: true, kecamatanId: true, opdId: true, posyanduId: true,
    desa: { select: { name: true, kecamatan: { select: { name: true } } } },
    kecamatan: { select: { name: true } },
    opd: { select: { name: true } },
    posyandu: { select: { name: true, desa: { select: { name: true, kecamatan: { select: { name: true } } } } } },
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return ok({ data: users, total, page, totalPages: Math.ceil(total / limit) || 1 })
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: parsed.data.email }, { username: parsed.data.username }] },
    select: { email: true, username: true }
  })
  if (existing) {
    if (existing.email === parsed.data.email) return err("Email sudah terdaftar", 409)
    return err("Username sudah digunakan", 409)
  }

  const { password, posyanduId, desaId, kecamatanId: inputKecId, ...rest } = parsed.data
  const hashed = await bcrypt.hash(password, 12)

  let noRegistrasi: string | null = null
  let resolvedKecamatanId: string | null = null

  if (parsed.data.role === "POSYANDU") {
    if (posyanduId) {
      const posyandu = await prisma.posyandu.findUnique({
        where: { id: posyanduId },
        select: { desaId: true, desa: { select: { kecamatanId: true } } },
      })
      resolvedKecamatanId = posyandu?.desa.kecamatanId ?? null
    } else if (desaId) {
      const desa = await prisma.desa.findUnique({
        where: { id: desaId },
        select: { kecamatanId: true },
      })
      resolvedKecamatanId = desa?.kecamatanId ?? null
    } else if (inputKecId) {
      resolvedKecamatanId = inputKecId
    }

    if (!resolvedKecamatanId) {
      return err("Tidak dapat menentukan kecamatan untuk generate nomor registrasi. Pilih desa atau posyandu terlebih dahulu.", 400)
    }

    noRegistrasi = await generateNoRegistrasi(resolvedKecamatanId)
  }

  const newUser = await prisma.user.create({
    data: {
      ...rest,
      password: hashed,
      posyanduId: posyanduId ?? null,
      desaId: desaId ?? null,
      kecamatanId: resolvedKecamatanId ?? inputKecId ?? null,
      noRegistrasi,
    },
    select: {
      id: true, name: true, email: true, username: true, role: true,
      isActive: true, createdAt: true, lastLoginAt: true,
      desaId: true, kecamatanId: true, opdId: true, posyanduId: true,
      desa: { select: { name: true, kecamatan: { select: { name: true } } } },
      kecamatan: { select: { name: true } },
      opd: { select: { name: true } },
      posyandu: { select: { name: true, desa: { select: { name: true, kecamatan: { select: { name: true } } } } } },
    },
  })
  return ok(newUser, "Pengguna berhasil ditambahkan")
}
