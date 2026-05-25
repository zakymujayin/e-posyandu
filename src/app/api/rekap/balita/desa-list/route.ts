import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["ADMIN_DPMD", "PETUGAS_KECAMATAN", "PETUGAS_DESA"])
  if (!user) return response!

  try {
    const { searchParams } = new URL(req.url)
    const kecId = searchParams.get("kecId")

    const where: Record<string, unknown> = {}
    if (user.role === "PETUGAS_KECAMATAN") {
      const p = await prisma.user.findUnique({ where: { id: user.id }, select: { kecamatanId: true } })
      if (p?.kecamatanId) where.kecamatanId = p.kecamatanId
    } else if (kecId) {
      where.kecamatanId = kecId
    }

    const desas = await prisma.desa.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return ok(desas)
  } catch (e) {
    console.error("[GET /api/rekap/balita/desa-list]", e)
    return err("Gagal mengambil data desa", 500)
  }
}
