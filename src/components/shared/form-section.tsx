import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitle, MutedText } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <Card className={cn("transition-all duration-300 border border-border shadow-xs hover:shadow-xs", className)}>
      <CardHeader className="border-b border-border/50 bg-muted/15 pb-4 px-6">
        <CardTitle>
          {title}
        </CardTitle>
        {description && (
          <MutedText className="mt-1.5 leading-relaxed">
            {description}
          </MutedText>
        )}
      </CardHeader>
      <CardContent className="px-6 py-5 flex flex-col gap-5">
        {children}
      </CardContent>
    </Card>
  )
}
