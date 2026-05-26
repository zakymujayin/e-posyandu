import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PengajuanForm } from "@/components/posyandu/pengajuan-form"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { CardTitle, MutedText } from "@/components/ui/typography"
import { BookOpen, FileText, ShieldAlert, Activity, Home as HomeIcon } from "lucide-react"

export default async function AjukanDesaPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "POSYANDU") redirect("/login")

  const [layanans, userWithKader] = await Promise.all([
    prisma.layananJenis.findMany({
      where: { isDesa: true, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { posyandu: { include: { desa: true } } },
    }),
  ])

  if (!userWithKader?.posyanduId) {
    return (
      <PageContainer className="py-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-semibold text-destructive">
            Profil Anda belum dihubungkan ke Posyandu. Silakan hubungi Admin.
          </p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="py-6">
      <PageHeader
        title="Pengajuan Layanan Desa"
        description="Ajukan layanan yang menjadi kewenangan desa. Pengajuan akan diverifikasi dan diselesaikan langsung oleh Petugas Desa."
        backHref="/posyandu/layanan"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start mt-6">
        {/* Kolom Kiri: Form Pengajuan */}
        <div className="lg:col-span-2 w-full space-y-6">
          <PengajuanForm
            layananList={JSON.parse(JSON.stringify(layanans))}
          />
        </div>

        {/* Kolom Kanan: Panduan */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
          {/* Card 1: Tentang Layanan Desa */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 px-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <HomeIcon className="size-4" />
                </div>
                <CardTitle>Tentang Layanan Desa</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-4">
              <MutedText className="leading-relaxed">
                Layanan yang merupakan kewenangan desa akan diselesaikan langsung oleh Petugas Desa tanpa perlu diteruskan ke OPD. Jika diperlukan, Petugas Desa dapat mengeskalasikan ke OPD terkait.
              </MutedText>
            </CardContent>
          </Card>

          {/* Card 2: Ketentuan Dokumen */}
          <Card className="border border-border bg-card shadow-xs">
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
                    Setiap file maksimal <strong>5 MB</strong>. Maksimal <strong>5 berkas</strong> pendukung.
                  </MutedText>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Alur */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 px-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Activity className="size-4" />
                </div>
                <CardTitle>
                  Alur Proses Layanan Desa
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative border-l-2 border-blue-500/20 ml-3 pl-5 space-y-5">
                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 size-3.5 rounded-full border-2 border-blue-500 bg-background flex items-center justify-center">
                    <span className="size-1.5 rounded-full bg-blue-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground leading-none">1. Input Formulir & Berkas</h4>
                  <MutedText className="mt-1 leading-normal">
                    Kader menginput data pelapor dan melampirkan dokumen pendukung.
                  </MutedText>
                </div>

                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 size-3.5 rounded-full border-2 border-blue-500/40 bg-background flex items-center justify-center">
                    <span className="size-1.5 rounded-full bg-blue-500/40" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground leading-none">2. Verifikasi & Penyelesaian Desa</h4>
                  <MutedText className="mt-1 leading-normal">
                    Petugas Desa memverifikasi dan menyelesaikan langsung. Jika tidak sanggup, dapat dieskalasikan ke OPD.
                  </MutedText>
                </div>

                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 size-3.5 rounded-full border-2 border-blue-500/40 bg-background flex items-center justify-center">
                    <span className="size-1.5 rounded-full bg-blue-500/40" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground leading-none">3. Selesai & Laporan Ditutup</h4>
                  <MutedText className="mt-1 leading-normal">
                    Layanan selesai ditangani, status terupdate, tercatat di arsip digital.
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
