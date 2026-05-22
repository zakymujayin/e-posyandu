import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import bcrypt from "bcryptjs"

export async function PATCH(req: Request) {
  const { user, response } = await requireAuth()
  if (!user) return response!

  const body = await req.json()
  const { name, currentPassword, newPassword } = body as {
    name?: string
    currentPassword?: string
    newPassword?: string
  }

  if (!name?.trim()) return err("Nama tidak boleh kosong", 400)

  if (newPassword) {
    if (!currentPassword) return err("Password lama wajib diisi", 400)
    if (newPassword.length < 6) return err("Password baru minimal 6 karakter", 400)

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) return err("User tidak ditemukan", 404)

    const valid = await bcrypt.compare(currentPassword, dbUser.password)
    if (!valid) return err("Password lama salah", 400)

    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim(), password: hash },
    })
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
    })
  }

  return ok({ message: "Profil berhasil diperbarui" })
}
