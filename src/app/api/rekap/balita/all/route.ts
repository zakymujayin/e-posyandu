import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const kecamatans = await prisma.kecamatan.findMany({
    include: {
      desas: {
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
      },
    },
    orderBy: { name: "asc" },
  })

  const rekap = kecamatans.map((kec) => {
    const allBalitas = kec.desas.flatMap((d) => d.posyandus.flatMap((p) => p.balitas))
    return {
      kecamatanId: kec.id,
      kecamatanName: kec.name,
      totalDesa: kec.desas.length,
      totalPosyandu: kec.desas.reduce((s, d) => s + d.posyandus.length, 0),
      totalBalita: allBalitas.length,
      ditimbangBulanIni: allBalitas.filter((b) => b.penimbangans.length > 0).length,
      belumDitimbang: allBalitas.filter((b) => b.penimbangans.length === 0).length,
    }
  })

  return NextResponse.json({ data: rekap })
}
