"use client"

import { useRouter, usePathname } from "next/navigation"
import { useCallback } from "react"
import type { HTMLAttributes } from "react"

interface ClientFilterFormProps extends HTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
}

export function ClientFilterForm({ children, className, ...props }: ClientFilterFormProps) {
  const router = useRouter()
  const pathname = usePathname()

  const apply = useCallback((form: HTMLFormElement) => {
    const data = new FormData(form)
    const params = new URLSearchParams()
    data.forEach((value, key) => {
      if (key !== "page" && value.toString().trim()) {
        params.set(key, value.toString())
      }
    })
    router.replace(`${pathname}?${params.toString()}`)
  }, [router, pathname])

  return (
    <form
      className={className}
      onChange={(e) => apply(e.currentTarget)}
      onSubmit={(e) => { e.preventDefault(); apply(e.currentTarget) }}
      {...props}
    >
      {children}
    </form>
  )
}
