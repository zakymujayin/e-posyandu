import ExcelJS from "exceljs"

async function main() {
  // ========== READ WILAYAH EXCEL ==========
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile("docs/DAFTAR NAMA DESA DAN KELURAHAN.xlsx")
  const ws = wb.worksheets[0]

  const kecNames = new Map<string, string>()
  const allDesa: { name: string; status: string; kecCode: string; code: string }[] = []
  let currentKecCode = ""
  let desaSeq = 0

  ws.eachRow((row, i) => {
    if (i < 6) return

    const colA = String(row.getCell(1).value || "").trim()
    const colB = String(row.getCell(2).value || "").trim()
    const colG = String(row.getCell(7).value || "").trim()

    if (!colG || colG === "Daftar" || colG === "Desa/Kelurahan" || colB === "TOTAL") return
    if (!colA.includes(".")) return

    const kecCode = colA.replace(/\./g, "")

    if (kecCode !== currentKecCode) {
      currentKecCode = kecCode
      desaSeq = 0
      kecNames.set(kecCode, colB)
    }

    desaSeq++
    const desaCode = `${kecCode}${String(desaSeq).padStart(4, "0")}`
    const isKelurahan = colB === "Rangkasbitung" && desaSeq > 11
    const status = isKelurahan ? "Kelurahan" : "Desa"

    allDesa.push({ name: colG, status, kecCode, code: desaCode })
  })

  // ========== OPD DATA ==========
  const opds = [
    { code: "DINKES", name: "Dinas Kesehatan" },
    { code: "DINDIK", name: "Dinas Pendidikan" },
    { code: "DPUPR", name: "Dinas Pekerjaan Umum dan Penataan Ruang" },
    { code: "DPERKIM", name: "Dinas Perumahan dan Kawasan Permukiman" },
    { code: "POLPP", name: "Satuan Polisi Pamong Praja" },
    { code: "DINSOS", name: "Dinas Sosial" },
  ]

  // ========== BUILD OUTPUT EXCEL ==========
  const outWb = new ExcelJS.Workbook()

  function addSheet(name: string, headers: string[], rows: Record<string, string>[]) {
    const ws = outWb.addWorksheet(name)
    ws.columns = headers.map((h) => ({ header: h, key: h, width: Math.max(h.length + 4, 20) }))
    for (const row of rows) ws.addRow(row)
    ws.getRow(1).font = { bold: true }
  }

  // ADMIN
  addSheet("ADMIN", ["Username", "Password", "Nama"], [
    { Username: "admin_dpmd", Password: "admin123", Nama: "Administrator DPMD" },
  ])

  // OPD — username: opd_{code} (underscore, lowercase code)
  addSheet("OPD", ["Username", "Password", "Nama", "OPD"],
    opds.map((o) => ({
      Username: `opd_${o.code.toLowerCase()}`,
      Password: "opd123",
      Nama: `Petugas ${o.name}`,
      OPD: o.name,
    })),
  )

  // Kecamatan — username: kec_{code}
  const kecRows = [...kecNames.entries()]
    .map(([code, name]) => ({
      Username: `kec_${code}`,
      Password: "kecamatan123",
      Nama: `Petugas Kecamatan ${name}`,
      Kecamatan: name,
    }))
    .sort((a, b) => a.Kecamatan.localeCompare(b.Kecamatan))
  addSheet("Kecamatan", ["Username", "Password", "Nama", "Kecamatan"], kecRows)

  // Desa/Kelurahan — username: desa_{code}
  const desaRows = allDesa
    .map((d) => ({
      Username: `desa_${d.code}`,
      Password: "petugas123",
      Nama: `Petugas ${d.status} ${d.name}`,
      "Desa/Kelurahan": d.name,
      Status: d.status,
      Kecamatan: kecNames.get(d.kecCode) || d.kecCode,
    }))
    .sort((a, b) => a.Kecamatan.localeCompare(b.Kecamatan) || a["Desa/Kelurahan"].localeCompare(b["Desa/Kelurahan"]))
  addSheet("Desa-Kelurahan", ["Username", "Password", "Nama", "Desa/Kelurahan", "Status", "Kecamatan"], desaRows)

  // Posyandu (empty)
  addSheet("Posyandu", ["Username", "Password", "Nama", "Posyandu", "Desa", "Kecamatan"], [])

  await outWb.xlsx.writeFile("docs/DAFTAR USER E-POSYANDU.xlsx")

  console.log(`✅ DAFTAR USER E-POSYANDU.xlsx`)
  console.log(`   ADMIN: 1 | OPD: ${opds.length} | Kec: ${kecRows.length} | Desa/Kel: ${desaRows.length} | Posyandu: 0`)
  console.log(`\n   Sample: admin_dpmd | opd_dinkes | ${kecRows[0]?.Username} | ${desaRows[0]?.Username}`)
}

main().catch(console.error)
