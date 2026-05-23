"use client"

import { createContext, useContext, ReactNode } from "react"

type LogoUrlContextType = string | null | undefined
const LogoUrlContext = createContext<LogoUrlContextType>(undefined)

export function LogoUrlProvider({
  logoUrl,
  children,
}: {
  logoUrl: string | null | undefined
  children: ReactNode
}) {
  return (
    <LogoUrlContext.Provider value={logoUrl}>
      {children}
    </LogoUrlContext.Provider>
  )
}

export function useLogoUrl() {
  return useContext(LogoUrlContext) ?? null
}
