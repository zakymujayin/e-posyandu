import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import bcrypt from "bcryptjs"

export async function PATCH(req: Request) {
  const { user, response } = await requireAuth()
  if (!user) return response!

  const body = await req.json()
  const { email, currentPassword, newPassword } = body as {
    email?: string
    currentPassword?: string
    newPassword?: string
  }
  let { name } = body as { name: string }

  if (!name?.trim()) return err("Nama tidak boleh kosong", 400)
  if (name.length > 100) return err("Nama maksimal 100 karakter", 400)
  name = name.replace(/[<>]/g, "")

  if (email !== undefined) {
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return err("Format email tidak valid", 400)
    }
    const existing = await prisma.user.findUnique({ where: { email: email.trim() } })
    if (existing && existing.id !== user.id) {
      return err("Email sudah digunakan pengguna lain", 409)
    }
  }

  const updateData: Record<string, string> = { name: name.trim() }
  if (email !== undefined) updateData.email = email.trim()

  if (newPassword) {
    if (!currentPassword) return err("Password lama wajib diisi", 400)
    if (newPassword.length < 8) return err("Password baru minimal 8 karakter", 400)

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) return err("User tidak ditemukan", 404)

    const valid = await bcrypt.compare(currentPassword, dbUser.password)
    if (!valid) return err("Password lama salah", 400)

    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { ...updateData, password: hash },
    })
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    })
  }

  return ok({ message: "Profil berhasil diperbarui" })
}
