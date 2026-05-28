export function hitungUsiaAnak(tanggalLahir: Date): number {
  const today = new Date()
  let usia = today.getFullYear() - tanggalLahir.getFullYear()
  const m = today.getMonth() - tanggalLahir.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < tanggalLahir.getDate())) usia--
  return usia
}

export const PENDIDIKAN_OPTIONS = [
  "Tidak Sekolah",
  "PAUD/TK",
  "SD/MI",
  "SMP/MTs",
  "SMA/MA/SMK",
] as const

export const STATUS_SEKOLAH_OPTIONS = [
  "Putus Sekolah",
  "Tidak Pernah Sekolah",
  "Lulus Tidak Melanjutkan",
] as const

export const ALASAN_OPTIONS = [
  "Ekonomi",
  "Jarak Sekolah Jauh",
  "Bekerja/Membantu Orang Tua",
  "Menikah Dini",
  "Disabilitas",
  "Tidak Ada Motivasi",
  "Lainnya",
] as const

export const PROGRAM_OPTIONS = [
  "Paket A",
  "Paket B",
  "Paket C",
  "Kursus Keterampilan",
  "Beasiswa",
  "Pendampingan",
  "Lainnya",
] as const

export type PendidikanTerakhir = typeof PENDIDIKAN_OPTIONS[number]
export type StatusSekolah = typeof STATUS_SEKOLAH_OPTIONS[number]
export type AlasanTidakSekolah = typeof ALASAN_OPTIONS[number]
export type ProgramDibutuhkan = typeof PROGRAM_OPTIONS[number]
