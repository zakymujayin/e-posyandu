import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PengajuanForm } from "@/components/kader/pengajuan-form"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { CardTitle, MutedText } from "@/components/ui/typography"
import { BookOpen, FileText, CheckCircle2, Clock, ShieldAlert, PhoneCall, HelpCircle, Activity } from "lucide-react"

export default async function AjukanPage({
  params,
}: {
  params: Promise<{ opdId: string }>
}) {
  const { opdId } = await params
  const session = await auth()
  if (!session?.user || session.user.role !== "KADER") redirect("/login")

  const [opd, layanans, userWithKader] = await Promise.all([
    prisma.opd.findUnique({ where: { id: opdId } }),
    prisma.layananJenis.findMany({ where: { opdId, isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.user.findUnique({ where: { id: session.user.id }, include: { posyandu: { include: { desa: true } } } }),
  ])

  if (!opd) notFound()
  if (!userWithKader?.posyanduId) {
    return (
      <PageContainer className="py-6">
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-semibold">
          Profil Anda belum dihubungkan ke Posyandu. Silakan hubungi Admin.
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="py-6">
      <PageHeader
        title={`Pengajuan Layanan ${opd.name}`}
        description="Lengkapi isian data kuesioner dinamis secara lengkap untuk verifikasi petugas."
        backHref="/kader"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start mt-6">
        {/* Kolom Kiri: Form Pengajuan */}
        <div className="lg:col-span-2 w-full space-y-6">
          <PengajuanForm
            opdId={opd.id}
            opdName={opd.name}
            layananList={JSON.parse(JSON.stringify(layanans))}
          />
        </div>

        {/* Kolom Kanan: Panduan & Alur SOP */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
          {/* Card 1: Ketentuan Dokumen */}
          <Card className="border border-border bg-card shadow-xs select-none">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 px-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="size-4" />
                </div>
                <CardTitle>
                  Ketentuan & Dokumen Lampiran
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex gap-3">
                <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Format File Lampiran</h4>
                  <MutedText className="mt-0.5 leading-relaxed">
                    Mendukung format gambar (<strong>JPG, JPEG, PNG</strong>) atau berkas dokumen (<strong>PDF</strong>).
                  </MutedText>
                </div>
              </div>

              <div className="flex gap-3 border-t border-border/50 pt-4">
                <ShieldAlert className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Batasan Ukuran File</h4>
                  <MutedText className="mt-0.5 leading-relaxed">
                    Setiap file yang diunggah maksimal berukuran <strong>5 MB</strong>. Anda dapat mengunggah hingga maksimal <strong>5 berkas</strong> pendukung.
                  </MutedText>
                </div>
              </div>

              <div className="flex gap-3 border-t border-border/50 pt-4">
                <Activity className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Referensi Video Tambahan</h4>
                  <MutedText className="mt-0.5 leading-relaxed">
                    Dapat menyertakan link video dari platform utama seperti <strong>YouTube, TikTok, Instagram, atau Facebook</strong> untuk mempermudah verifikasi dinas.
                  </MutedText>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Alur SOP */}
          <Card className="border border-border bg-card shadow-xs select-none">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 px-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Activity className="size-4" />
                </div>
                <CardTitle>
                  Alur Proses Pengajuan Layanan
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative border-l-2 border-primary/20 ml-3 pl-5 space-y-5">
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 size-3.5 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                    <span className="size-1.5 rounded-full bg-primary" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground leading-none">1. Input Formulir & Berkas</h4>
                  <MutedText className="mt-1 leading-normal">
                    Kader menginput data pelapor, deskripsi kebutuhan, serta melampirkan file pendukung.
                  </MutedText>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 size-3.5 rounded-full border-2 border-primary/40 bg-background flex items-center justify-center">
                    <span className="size-1.5 rounded-full bg-primary/40" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground leading-none">2. Verifikasi Tingkat Desa</h4>
                  <MutedText className="mt-1 leading-normal">
                    Petugas Desa memvalidasi kelengkapan dokumen warga (SLA Respon Maksimal 3 Hari Kerja).
                  </MutedText>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 size-3.5 rounded-full border-2 border-primary/40 bg-background flex items-center justify-center">
                    <span className="size-1.5 rounded-full bg-primary/40" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground leading-none">3. Tindak Lanjut Dinas (OPD)</h4>
                  <MutedText className="mt-1 leading-normal">
                    Dinas terkait menganalisis permohonan dan melakukan aksi lapangan / penyelesaian masalah.
                  </MutedText>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 size-3.5 rounded-full border-2 border-primary/40 bg-background flex items-center justify-center">
                    <span className="size-1.5 rounded-full bg-primary/40" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground leading-none">4. Selesai & Laporan Ditutup</h4>
                  <MutedText className="mt-1 leading-normal">
                    Laporan selesai ditangani, status terupdate otomatis, dan tercatat di arsip digital kecamatan.
                  </MutedText>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
