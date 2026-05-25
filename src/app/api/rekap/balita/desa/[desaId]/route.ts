import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"

export async function GET(req: NextRequest, { params }: { params: Promise<{ desaId: string }> }) {
  const { user, response } = await requireAuth(["PETUGAS_DESA", "ADMIN_DPMD"])
  if (!user) return response!

  const { desaId } = await params

  if (user.role === "PETUGAS_DESA") {
    const petugasDesa = await prisma.user.findUnique({ where: { id: user.id }, select: { desaId: true } })
    if (petugasDesa?.desaId !== desaId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const posyandus = await prisma.posyandu.findMany({
    where: { desaId },
    include: {
      balitas: {
        where: { isActive: true },
        include: {
          penimbangans: {
            where: { bulan: bulanIni, tahun: tahunIni },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const rekap = posyandus.map((p) => ({
    posyanduId: p.id,
    posyanduName: p.name,
    totalBalita: p.balitas.length,
    ditimbangBulanIni: p.balitas.filter((b) => b.penimbangans.length > 0).length,
    belumDitimbang: p.balitas.filter((b) => b.penimbangans.length === 0).length,
  }))

  return NextResponse.json({ data: rekap })
}
