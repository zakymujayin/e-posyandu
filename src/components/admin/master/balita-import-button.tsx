"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BalitaImport } from "./balita-import"

export function BalitaImportButton({
  posyanduId,
  posyanduName,
}: {
  posyanduId: string
  posyanduName: string
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="font-bold text-xs gap-1.5"
      >
        <Upload className="w-4 h-4" /> Import Balita
      </Button>
      <BalitaImport
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => router.refresh()}
        posyanduId={posyanduId}
        posyanduName={posyanduName}
      />
    </>
  )
}
