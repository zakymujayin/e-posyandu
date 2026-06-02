import { PageContainer } from "@/components/layout/page-container"

export default function Loading() {
  return (
    <PageContainer className="space-y-6 animate-pulse">
      <div className="h-24 bg-muted rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="h-64 bg-muted rounded-xl" />
    </PageContainer>
  )
}
