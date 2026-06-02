"use client"

import dynamic from "next/dynamic"

export const LaporanBalitaCharts = dynamic(() => import("@/components/admin/laporan-balita-charts").then((m) => ({ default: m.LaporanBalitaCharts })), { ssr: false })
