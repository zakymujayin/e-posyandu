"use client"

import { createContext, useContext, ReactNode } from "react"

interface AppLogoContextType {
  kabupatenLogoUrl: string | null | undefined
  posyanduLogoUrl: string | null | undefined
}

const AppLogoContext = createContext<AppLogoContextType>({
  kabupatenLogoUrl: undefined,
  posyanduLogoUrl: undefined,
})

export function AppLogoProvider({
  kabupatenLogoUrl,
  posyanduLogoUrl,
  children,
}: {
  kabupatenLogoUrl: string | null | undefined
  posyanduLogoUrl: string | null | undefined
  children: ReactNode
}) {
  return (
    <AppLogoContext.Provider value={{ kabupatenLogoUrl, posyanduLogoUrl }}>
      {children}
    </AppLogoContext.Provider>
  )
}

export function useAppLogos() {
  const ctx = useContext(AppLogoContext)
  return {
    kabupatenLogoUrl: ctx.kabupatenLogoUrl ?? null,
    posyanduLogoUrl: ctx.posyanduLogoUrl ?? null,
  }
}
