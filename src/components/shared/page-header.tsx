import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

import { PageTitle, MutedText } from "@/components/ui/typography"

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, backHref, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border/65 select-none mb-6">
      <div className="flex items-start gap-3">
        {backHref && (
          <Button
            variant="outline"
            size="icon-sm"
            asChild
            className="mt-1 transition-transform duration-200 hover:-translate-x-0.5"
          >
            <Link href={backHref} aria-label="Kembali">
              <ArrowLeft className="size-4 text-muted-foreground" />
            </Link>
          </Button>
        )}
        <div>
          <PageTitle>
            {title}
          </PageTitle>
          {description && (
            <MutedText className="mt-2 max-w-2xl leading-relaxed">
              {description}
            </MutedText>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
