"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CardTitle } from "@/components/ui/typography"
import { User, MapPin, Users, GraduationCap, ClipboardList, Trash2, Pencil, Loader2 } from "lucide-react"
import { hitungUsiaAnak } from "@/lib/utils-ats"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

interface ATSDetailCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  record: any
  canEdit?: boolean
  atsId?: string
}

const STATUS_COLORS: Record<string, string> = {
  "Putus Sekolah": "bg-red-500/10 text-red-700 border-red-500/30",
  "Tidak Pernah Sekolah": "bg-amber-500/10 text-amber-700 border-amber-500/30",
  "Lulus Tidak Melanjutkan": "bg-blue-500/10 text-blue-700 border-blue-500/30",
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export function ATSDetailCard({ record, canEdit, atsId }: ATSDetailCardProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const usia = hitungUsiaAnak(new Date(record.tanggalLahir))
  const program = Array.isArray(record.programDibutuhkan) ? (record.programDibutuhkan as string[]).join(", ") : ""

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/ats/${atsId}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Gagal menghapus data"); return }
      toast.success("Data ATS berhasil dihapus")
      router.push("/posyandu/ats")
      router.refresh()
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 px-5">
            <div className="flex items-center gap-2"><User className="size-4 text-primary" /><CardTitle>Data Anak</CardTitle></div>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-2 gap-x-6 gap-y-3">
            <Field label="Nama Anak" value={record.namaAnak} />
            <Field label="NIK" value={record.nik} />
            <Field label="Jenis Kelamin" value={record.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"} />
            <Field label="Usia" value={`${usia} tahun`} />
            <Field label="Tempat Lahir" value={record.tempatLahir} />
            <Field label="Tanggal Lahir" value={format(new Date(record.tanggalLahir), "d MMMM yyyy", { locale: localeId })} />
            <div className="col-span-2"><Field label="Alamat" value={record.alamat} /></div>
            <Field label="RT/RW" value={record.rtRw} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 px-5">
            <div className="flex items-center gap-2"><MapPin className="size-4 text-primary" /><CardTitle>Data Wilayah</CardTitle></div>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-2 gap-x-6 gap-y-3">
            <Field label="Desa/Kelurahan" value={record.desa?.name} />
            <Field label="Kecamatan" value={record.kecamatan?.name} />
            <Field label="Kabupaten/Kota" value="Lebak" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 px-5">
            <div className="flex items-center gap-2"><Users className="size-4 text-primary" /><CardTitle>Data Orang Tua / Wali</CardTitle></div>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-2 gap-x-6 gap-y-3">
            <Field label="Nama Orang Tua/Wali" value={record.namaOrangTua} />
            <Field label="Pekerjaan" value={record.pekerjaanOrangTua} />
            <Field label="No. HP" value={record.noHpOrangTua} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 px-5">
            <div className="flex items-center gap-2"><GraduationCap className="size-4 text-primary" /><CardTitle>Riwayat Pendidikan</CardTitle></div>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-2 gap-x-6 gap-y-3">
            <Field label="Pendidikan Terakhir" value={record.pendidikanTerakhir} />
            <Field label="Kelas Terakhir" value={record.kelasTerakhir} />
            <div className="col-span-2">
              <span className="text-xs text-muted-foreground">Status Sekolah</span>
              <div className="mt-1">
                <Badge className={`text-xs ${STATUS_COLORS[record.statusSekolah] ?? ""}`}>{record.statusSekolah}</Badge>
              </div>
            </div>
            <Field label="Alasan" value={record.alasanTidakSekolah === "Lainnya" && record.alasanLainnya ? `Lainnya: ${record.alasanLainnya}` : record.alasanTidakSekolah} />
            <Field label="Tahun Putus Sekolah" value={record.tahunPutusSekolah?.toString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 px-5">
            <div className="flex items-center gap-2"><ClipboardList className="size-4 text-primary" /><CardTitle>Kebutuhan & Tindak Lanjut</CardTitle></div>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-2 gap-x-6 gap-y-3">
            <Field label="Keinginan Kembali Sekolah" value={record.keinginanSekolah} />
            <Field label="Program Dibutuhkan" value={program} />
            <div className="col-span-2"><Field label="Keterangan" value={record.keterangan} /></div>
          </CardContent>
        </Card>

        {canEdit && atsId && (
          <div className="flex gap-3 justify-end">
            <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)} className="gap-2">
              <Trash2 className="size-4" /> Hapus
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2 font-bold">
              <Link href={`/posyandu/ats/${atsId}/edit`}><Pencil className="size-4" /> Edit</Link>
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hapus Data ATS</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Apakah Anda yakin ingin menghapus data <strong>{record.namaAnak}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="size-4 animate-spin" />} Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
