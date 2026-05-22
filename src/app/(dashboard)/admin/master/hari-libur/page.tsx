import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { HolidaysManager } from "@/components/admin/master/holidays-manager"
import { PageHeader } from "@/components/shared/page-header"
import { PageContainer } from "@/components/layout/page-container"

export default async function MasterHariLiburPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN_DPMD") redirect("/login")

  const holidays = await prisma.publicHoliday.findMany({
    orderBy: { date: "asc" },
  })

  const serialized = JSON.parse(JSON.stringify(holidays))

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Hari Libur Nasional"
        description="Kelola daftar hari libur nasional yang digunakan dalam kalkulasi batas waktu SOP 7 hari kerja."
        backHref="/admin/master"
      />
      <HolidaysManager initialHolidays={serialized} />
    </PageContainer>
  )
}
