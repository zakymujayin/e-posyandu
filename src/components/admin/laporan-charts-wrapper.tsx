"use client"

import dynamic from "next/dynamic"

export const LaporanCharts = dynamic(() => import("@/components/admin/laporan-charts").then((m) => ({ default: m.LaporanCharts })), { ssr: false })
