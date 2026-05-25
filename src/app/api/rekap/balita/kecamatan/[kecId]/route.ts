import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"

export async function GET(req: NextRequest, { params }: { params: Promise<{ kecId: string }> }) {
  const { user, response } = await requireAuth(["PETUGAS_KECAMATAN", "ADMIN_DPMD"])
  if (!user) return response!

  const { kecId } = await params

  if (user.role === "PETUGAS_KECAMATAN") {
    const petugas = await prisma.user.findUnique({ where: { id: user.id }, select: { kecamatanId: true } })
    if (petugas?.kecamatanId !== kecId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const desas = await prisma.desa.findMany({
    where: { kecamatanId: kecId },
    include: {
      posyandus: {
        include: {
          balitas: {
            where: { isActive: true },
            include: {
              penimbangans: { where: { bulan: bulanIni, tahun: tahunIni } },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const rekap = desas.map((d) => {
    const allBalitas = d.posyandus.flatMap((p) => p.balitas)
    return {
      desaId: d.id,
      desaName: d.name,
      totalPosyandu: d.posyandus.length,
      totalBalita: allBalitas.length,
      ditimbangBulanIni: allBalitas.filter((b) => b.penimbangans.length > 0).length,
      belumDitimbang: allBalitas.filter((b) => b.penimbangans.length === 0).length,
    }
  })

  return NextResponse.json({ data: rekap })
}
