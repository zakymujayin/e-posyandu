import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ layananId: string }> }
) {
  const { user, response } = await requireAuth()
  if (!user) return response!

  const { layananId } = await params

  try {
    const fields = await prisma.formField.findMany({
      where: { layananJenisId: layananId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        fieldLabel: true,
        fieldName: true,
        fieldType: true,
        fieldOptions: true,
        isRequired: true,
        placeholder: true,
        helperText: true,
        sortOrder: true,
      },
    })
    return ok(fields)
  } catch {
    return err("Gagal mengambil form fields", 500)
  }
}
