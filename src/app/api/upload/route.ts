import { requireAuth, ok, err } from "@/lib/api-helpers"
import { uploadFile } from "@/lib/upload"

export async function POST(req: Request) {
  const { user, response } = await requireAuth()
  if (!user) return response!

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) return err("File tidak ditemukan")

    const result = await uploadFile(file)
    return ok(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gagal mengupload file"
    return err(message)
  }
}
