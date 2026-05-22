import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface DataTableProps {
  columns: string[]
  isLoading?: boolean
  emptyState?: React.ReactNode
  children: React.ReactNode
  dataLength: number
  className?: string
}

export function DataTable({
  columns,
  isLoading,
  emptyState,
  children,
  dataLength,
  className,
}: DataTableProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden shadow-xs", className)}>
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40 select-none">
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className="h-12 px-4 text-sm font-bold text-muted-foreground/90 uppercase tracking-wider"
                >
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="p-4">
                      <Skeleton className="h-4 w-2/3 my-1" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : dataLength === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64 text-center p-0">
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                      <p className="text-sm">Tidak ada data ditemukan</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              children
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
