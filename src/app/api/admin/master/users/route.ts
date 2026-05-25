import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

const ROLES = ["POSYANDU", "PETUGAS_DESA", "PETUGAS_KECAMATAN", "PETUGAS_OPD", "ADMIN_DPMD"] as const

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  username: z.string().min(3, "Username minimal 3 karakter").regex(/^[a-z0-9_]+$/, "Username hanya huruf kecil, angka, dan underscore"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(ROLES, { message: "Role tidak valid" }),
  noRegistrasi: z.string().optional().nullable(),
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

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, username: true, role: true,
      isActive: true, createdAt: true, lastLoginAt: true,
      desa: { select: { name: true } },
      kecamatan: { select: { name: true } },
      opd: { select: { name: true } },
      posyandu: { select: { name: true } },
    },
    take: 100,
  })
  return ok(users)
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

  const { password, ...rest } = parsed.data
  const hashed = await bcrypt.hash(password, 12)

  const newUser = await prisma.user.create({
    data: { ...rest, password: hashed },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })
  return ok(newUser, "Pengguna berhasil ditambahkan")
}
