import ExcelJS from "exceljs"
import { readdirSync } from "fs"
import { join } from "path"

const BASE = "docs/Data Posyandu Kab. Lebak"
const OUTPUT = "docs/POSYANDU_KAB_LEBAK.xlsx"
const OFFICIAL_FILE = "docs/DAFTAR NAMA DESA DAN KELURAHAN.xlsx"

const SKIP_FILES = new Set([
  join(BASE, "KECAMATAN BAYAH/PENDATAAN POSYANDU.xlsx"),
  join(BASE, "PENDATAAN POSYANDU DESA HEGARMANAH.xlsx"),
])

const TYPO_FIX: Record<string, string> = {
  "COPANAS": "CIPANAS",
  "GUNUNG KENCANA": "GUNUNGKENCANA",
  "LEBAKGEDONG": "LEBAK GEDONG",
  "SANGIANGJAYA": "SANGIANG JAYA",
  "BANJARIRIGASI": "BANJAR IRIGASI",
  "JALUPANGMULYA": "JALUPANG MULYA",
  "GUBUGAN CIBEUREUM": "GUBUGCIBEUREUM",
  "PASIRKECAPI": "PASIR KECAPI",
  "SENNAGHATI": "SENANGHATI",
  "KATAPANG": "KETAPANG",
  "BUNGURMEKAR": "BANGUNMEKAR",
}

interface OfficialDesa {
  kecCode: string
  kecName: string
  desaName: string
}

interface PosyanduData {
  nama: string
  alamat: string
  desa: string
  kecamatan: string
  kodeDesa: string
  kodeKec: string
}

function listFiles(dir: string): string[] {
  const results: string[] = []
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) results.push(...listFiles(full))
    else if (e.name.endsWith(".xlsx")) results.push(full)
  }
  return results
}

function levenshtein(a: string, b: string): number {
  const m: number[][] = []
  for (let i = 0; i <= a.length; i++) {
    m[i] = [i]
    for (let j = 1; j <= b.length; j++) {
      if (i === 0) m[0][j] = j
      else {
        m[i][j] = Math.min(
          m[i - 1][j] + 1,
          m[i][j - 1] + 1,
          m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        )
      }
    }
  }
  return m[a.length][b.length]
}

const norm = (s: string) =>
  s
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/^DESA\s+/, "")
    .replace(/^KEC[.\s]+/, "")
    .trim()

async function main() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(OFFICIAL_FILE)
  const ws = wb.worksheets[0]
  const officialDesaList: OfficialDesa[] = []
  const desaKecMap = new Map<string, OfficialDesa>() // "DESA|KEC" -> full record
  const kecMap = new Map<string, string>()

  for (let r = 7; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const code = String(row.getCell(1).value ?? "").trim()
    const kecName = String(row.getCell(2).value ?? "").trim()
    const desaName = String(row.getCell(7).value ?? "").trim()
    if (!code || !code.match(/^\d+\.\d+\.\d+$/)) continue
    if (kecName === "TOTAL" || !desaName || desaName === "Daftar" || desaName === "Desa/Kelurahan") continue
    const sc = code.replace(/\./g, "")
    const kcu = kecName.toUpperCase()
    if (!kecMap.has(kcu)) kecMap.set(kcu, sc)
    const entry: OfficialDesa = { kecCode: sc, kecName, desaName }
    officialDesaList.push(entry)
    desaKecMap.set(desaName.toUpperCase() + "|" + kcu, entry)
  }

  const files = listFiles(BASE)
  const allData: PosyanduData[] = []
  const seen = new Set<string>()

  let processedCount = 0
  let skippedCount = 0

  for (const file of files) {
    if (SKIP_FILES.has(file)) { skippedCount++; continue }
    processedCount++

    const wb2 = new ExcelJS.Workbook()
    await wb2.xlsx.readFile(file)
    const ws2 = wb2.worksheets[0]
    if (!ws2) continue

    let headerRow = -1
    for (let r = 3; r <= Math.min(10, ws2.rowCount); r++) {
      const row = ws2.getRow(r)
      let hasNo = false, hasNama = false, hasAlamat = false
      row.eachCell((cell) => {
        const v = String(cell.value ?? "").toUpperCase()
        if (v === "NO" || v === "NO.") hasNo = true
        if (v.includes("NAMA")) hasNama = true
        if (v.includes("ALAMAT")) hasAlamat = true
      })
      if (hasNo && hasNama && hasAlamat) headerRow = r
    }
    if (headerRow < 0) { console.warn("No header:", file); continue }

    for (let r = headerRow + 1; r <= ws2.rowCount; r++) {
      const rowObj = ws2.getRow(r)
      const vals: string[] = []
      rowObj.eachCell((cell) => vals.push(String(cell.value ?? "")))

      const nama = (vals[1] || "").trim()
      const alamat = (vals[2] || "").trim()
      const desaRaw = norm(vals[3] || "")
      const kecRaw = norm(vals[4] || "")

      if (!nama) continue
      if (/^(Mengetahui|Kepala|Tanda|TTD|Kades|[0-9\s,]+\s*(?:Juni|Juli|Januari|Februari|Maret|April|Mei|Agustus|September|Oktober|November|Desember))/i.test(nama)) continue
      if (!desaRaw) continue
      if (nama.toUpperCase().includes("NAMA POSYANDU") && desaRaw === "DESA" && kecRaw === "KECAMATAN") continue

      const desaFinal = TYPO_FIX[desaRaw] || desaRaw
      const kecFinal = TYPO_FIX[kecRaw] || kecRaw

      // Step 1: Try exact match with both desa + kec
      let found = desaKecMap.get(desaFinal + "|" + kecFinal)

      // Step 2: Try matching desa only (fallback, may be ambiguous)
      if (!found) {
        let best = ""; let bd = 99
        for (const [key] of desaKecMap) {
          const [dName] = key.split("|")
          const d = levenshtein(desaFinal, dName)
          if (d < bd && d <= 2) { bd = d; best = key }
        }
        if (best) { found = desaKecMap.get(best) }
        else {
          // Step 3: Check if it matches by desa in any kec
          const candidates = officialDesaList.filter(d => d.desaName.toUpperCase() === desaFinal)
          if (candidates.length === 1) {
            found = candidates[0]
          } else if (candidates.length > 1) {
            console.warn("Ambiguous desa:", desaFinal, "in kec:", kecFinal, "- candidates:", candidates.map(c => c.kecName).join(", "), "from", file)
          }
        }
      }

      if (!found) { console.warn("Unmatched desa:", desaFinal, "kec:", kecFinal, "from", file); continue }

      const kecCode = kecMap.get(found.kecName.toUpperCase()) || found.kecCode
      const desaCode = found.kecCode || ""

      if (!kecCode || !desaCode) { console.warn("No code:", nama, desaFinal, kecFinal); continue }

      const key = `${nama.toUpperCase()}|${alamat.toUpperCase()}|${desaFinal}|${kecFinal}`
      if (seen.has(key)) continue
      seen.add(key)

      allData.push({
        nama,
        alamat,
        desa: found?.desaName || desaFinal,
        kecamatan: found?.kecName || kecFinal,
        kodeDesa: desaCode,
        kodeKec: kecCode,
      })
    }
  }

  if (allData.length === 0) {
    console.error("NO DATA FOUND — check paths and files")
    process.exit(1)
  }

  const outWb = new ExcelJS.Workbook()
  const outWs = outWb.addWorksheet("POSYANDU")
  outWs.columns = [
    { header: "NO", key: "no", width: 8 },
    { header: "NAMA POSYANDU", key: "nama", width: 30 },
    { header: "ALAMAT", key: "alamat", width: 50 },
    { header: "DESA", key: "desa", width: 25 },
    { header: "KECAMATAN", key: "kecamatan", width: 25 },
    { header: "KODE DESA", key: "kodeDesa", width: 15 },
    { header: "KODE KECAMATAN", key: "kodeKec", width: 15 },
  ]

  const headerRowOut = outWs.getRow(1)
  headerRowOut.font = { bold: true }
  headerRowOut.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } }

  allData.forEach((d, i) => {
    outWs.addRow({ no: i + 1, ...d })
  })

  await outWb.xlsx.writeFile(OUTPUT)

  const byKec = new Map<string, number>()
  for (const d of allData) byKec.set(d.kecamatan, (byKec.get(d.kecamatan) || 0) + 1)

  console.log("=".repeat(60))
  console.log("KONSOLIDASI POSYANDU KAB. LEBAK")
  console.log("=".repeat(60))
  console.log(`File diproses : ${processedCount} (${skippedCount} diskip)`)
  console.log(`Total posyandu: ${allData.length}`)
  console.log(`Desa unik     : ${new Set(allData.map(d => d.desa)).size}`)
  console.log(`Kec unik      : ${byKec.size}`)
  console.log(`Output        : ${OUTPUT}`)
  console.log("")
  console.log("Per Kecamatan:")
  for (const [k, c] of [...byKec].sort()) console.log(`  ${k}: ${c}`)
}

main()
