"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MutedText } from "@/components/ui/typography"

interface PaginationProps {
  page: number
  totalPages: number
  total?: number
  buildHref?: (page: number) => string
  onPageChange?: (page: number) => void
}

export function Pagination({ page, totalPages, total, buildHref, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border border-border rounded-lg p-4">
      <MutedText>
        Halaman {page} dari {totalPages}{total !== undefined ? ` (${total} data)` : ""}
      </MutedText>
      <div className="flex gap-2">
        {buildHref ? (
          <>
            <Button variant="outline" size="sm" disabled={prevDisabled} asChild={!prevDisabled} className="font-semibold text-xs md:text-sm">
              {!prevDisabled ? <Link href={buildHref(page - 1)}>&larr; Sebelumnya</Link> : <span>&larr; Sebelumnya</span>}
            </Button>
            <Button variant="outline" size="sm" disabled={nextDisabled} asChild={!nextDisabled} className="font-semibold text-xs md:text-sm">
              {!nextDisabled ? <Link href={buildHref(page + 1)}>Selanjutnya &rarr;</Link> : <span>Selanjutnya &rarr;</span>}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" disabled={prevDisabled} onClick={() => onPageChange?.(page - 1)} className="font-semibold text-xs md:text-sm">
              &larr; Sebelumnya
            </Button>
            <Button variant="outline" size="sm" disabled={nextDisabled} onClick={() => onPageChange?.(page + 1)} className="font-semibold text-xs md:text-sm">
              Selanjutnya &rarr;
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
