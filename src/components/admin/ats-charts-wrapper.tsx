"use client"

import dynamic from "next/dynamic"

export const ATSCharts = dynamic(() => import("@/components/admin/ats-charts").then((m) => ({ default: m.ATSCharts })), { ssr: false })
