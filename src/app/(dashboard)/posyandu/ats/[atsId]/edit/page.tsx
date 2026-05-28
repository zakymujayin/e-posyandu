import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/shared/page-header"
import { ATSForm } from "@/components/posyandu/ats-form"
import { format } from "date-fns"

export default async function EditATSPage({ params }: { params: Promise<{ atsId: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "POSYANDU") redirect("/login")

  const { atsId } = await params

  const [user, record] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { posyandu: { select: { desa: { select: { name: true, kecamatan: { select: { name: true } } } } } } },
    }),
    prisma.anakTidakSekolah.findFirst({
      where: { id: atsId, posyanduUserId: session.user.id, isActive: true },
    }),
  ])

  if (!record) notFound()

  const wilayah = {
    desaName: user?.posyandu?.desa?.name ?? "-",
    kecamatanName: user?.posyandu?.desa?.kecamatan?.name ?? "-",
  }

  const defaultValues = {
    namaAnak: record.namaAnak,
    nik: record.nik ?? "",
    jenisKelamin: record.jenisKelamin,
    tempatLahir: record.tempatLahir,
    tanggalLahir: format(new Date(record.tanggalLahir), "yyyy-MM-dd"),
    alamat: record.alamat,
    rtRw: record.rtRw ?? "",
    namaOrangTua: record.namaOrangTua,
    pekerjaanOrangTua: record.pekerjaanOrangTua ?? "",
    noHpOrangTua: record.noHpOrangTua ?? "",
    pendidikanTerakhir: record.pendidikanTerakhir,
    kelasTerakhir: record.kelasTerakhir ?? "",
    statusSekolah: record.statusSekolah,
    alasanTidakSekolah: record.alasanTidakSekolah,
    alasanLainnya: record.alasanLainnya ?? "",
    tahunPutusSekolah: record.tahunPutusSekolah?.toString() ?? "",
    keinginanSekolah: record.keinginanSekolah,
    programDibutuhkan: Array.isArray(record.programDibutuhkan) ? record.programDibutuhkan as string[] : [],
    programLainnya: record.programLainnya ?? "",
    keterangan: record.keterangan ?? "",
  }

  return (
    <PageContainer className="space-y-6 max-w-7xl">
      <PageHeader title={`Edit Data: ${record.namaAnak}`} description="Perbarui data anak tidak sekolah" backHref={`/posyandu/ats/${atsId}`} />
      <ATSForm mode="edit" atsId={atsId} defaultValues={defaultValues} wilayah={wilayah} />
    </PageContainer>
  )
}
