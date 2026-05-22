import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.resend.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER ?? "resend",
    pass: process.env.SMTP_PASS ?? "",
  },
})

const from = process.env.EMAIL_FROM ?? "noreply@example.com"
const appUrl = process.env.APP_URL ?? "http://localhost:3000"

function roleBasePath(role: string) {
  if (role === "KADER") return "kader/riwayat"
  if (role === "PETUGAS_DESA") return "petugas-desa/verifikasi"
  if (role === "PETUGAS_OPD") return "opd/tindak-lanjut"
  return role.toLowerCase()
}

export async function sendStatusChangeEmail(
  to: string,
  name: string,
  tiketNumber: string,
  statusLabel: string,
  pengajuanId: string,
  role: string
) {
  if (!process.env.SMTP_PASS) return
  const link = `${appUrl}/${roleBasePath(role)}/${pengajuanId}`
  await transporter.sendMail({
    from,
    to,
    subject: `[E-Posyandu] Status Pengajuan ${tiketNumber} — ${statusLabel}`,
    html: `
      <p>Halo <strong>${name}</strong>,</p>
      <p>Status pengajuan <strong>${tiketNumber}</strong> telah diperbarui menjadi: <strong>${statusLabel}</strong></p>
      <p><a href="${link}" style="color:#2563eb">Lihat detail pengajuan →</a></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <p style="color:#9ca3af;font-size:12px">E-Posyandu — DPMD Kabupaten Lebak</p>
    `,
  })
}

export async function sendNewPengajuanEmail(
  to: string,
  officerName: string,
  tiketNumber: string,
  kaderName: string
) {
  if (!process.env.SMTP_PASS) return
  await transporter.sendMail({
    from,
    to,
    subject: `[E-Posyandu] Pengajuan Baru Menunggu Verifikasi — ${tiketNumber}`,
    html: `
      <p>Halo <strong>${officerName}</strong>,</p>
      <p>Pengajuan baru <strong>${tiketNumber}</strong> dari kader <strong>${kaderName}</strong> sedang menunggu verifikasi.</p>
      <p><a href="${appUrl}/petugas-desa/verifikasi" style="color:#2563eb">Buka halaman verifikasi →</a></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <p style="color:#9ca3af;font-size:12px">E-Posyandu — DPMD Kabupaten Lebak</p>
    `,
  })
}

export async function sendDeadlineReminderEmail(
  to: string,
  name: string,
  tiketNumber: string,
  daysLeft: number,
  pengajuanId: string
) {
  if (!process.env.SMTP_PASS) return
  const link = `${appUrl}/opd/tindak-lanjut/${pengajuanId}`
  await transporter.sendMail({
    from,
    to,
    subject: `[E-Posyandu] Pengingat Deadline SOP — ${tiketNumber} (${daysLeft} hari lagi)`,
    html: `
      <p>Halo <strong>${name}</strong>,</p>
      <p>Pengajuan <strong>${tiketNumber}</strong> akan melewati deadline SOP dalam <strong>${daysLeft} hari</strong>.</p>
      <p>Harap segera tindak lanjuti sebelum deadline terlewat.</p>
      <p><a href="${link}" style="color:#2563eb">Lihat pengajuan →</a></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <p style="color:#9ca3af;font-size:12px">E-Posyandu — DPMD Kabupaten Lebak</p>
    `,
  })
}
