import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PengajuanDetail } from "@/components/shared/pengajuan-detail"
import { VerifikasiActions } from "@/components/petugas-desa/verifikasi-actions"
import { getSopInfo } from "@/lib/sop"
import { ArrowLeft } from "lucide-react"

export default async function VerifikasiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id },
    include: {
      opd: { select: { id: true, name: true, color: true, icon: true } },
      layananJenis: { select: { id: true, name: true } },
      desa: { select: { id: true, name: true } },
      posyandu: { select: { id: true, name: true } },
      kader: { select: { id: true, name: true } },
      fieldValues: {
        include: { formField: { select: { fieldLabel: true, fieldType: true, fieldName: true } } },
      },
      attachments: true,
      verifikasiDesa: {
        include: { petugasDesa: { select: { name: true } } },
      },
      tindakLanjuts: {
        orderBy: { submittedAt: "desc" },
        include: { petugasOpd: { select: { name: true } }, attachments: true },
      },
      adminActions: {
        orderBy: { createdAt: "desc" },
        include: { admin: { select: { name: true } } },
      },
      activityLogs: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!pengajuan) notFound()

  // Scope check
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { desaId: true } })
  if (user?.desaId !== pengajuan.desaId) redirect("/petugas-desa")

  const sopInfo = await getSopInfo(id)

  const canVerify = pengajuan.status === "MENUNGGU_VERIFIKASI"

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/petugas-desa" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Detail Pengajuan</h1>
      </div>

      <PengajuanDetail
        pengajuan={pengajuan}
        sopInfo={sopInfo ? { remainingDays: sopInfo.remainingDays, sopStatus: sopInfo.sopStatus } : null}
      />

      {canVerify && <VerifikasiActions pengajuanId={id} />}
    </div>
  )
}
