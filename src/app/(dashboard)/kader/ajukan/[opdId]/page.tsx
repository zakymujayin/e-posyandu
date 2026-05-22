import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PengajuanForm } from "@/components/kader/pengajuan-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AjukanPage({
  params,
}: {
  params: Promise<{ opdId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { opdId } = await params

  const opd = await prisma.opd.findUnique({
    where: { id: opdId, isActive: true },
    select: { id: true, name: true },
  })

  if (!opd) notFound()

  const layananList = await prisma.layananJenis.findMany({
    where: { opdId, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, description: true },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/kader" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengajuan ke {opd.name}</h1>
          <p className="text-sm text-gray-500">Isi form berikut dengan lengkap dan benar</p>
        </div>
      </div>

      <PengajuanForm
        opdId={opd.id}
        opdName={opd.name}
        layananList={layananList}
      />
    </div>
  )
}
