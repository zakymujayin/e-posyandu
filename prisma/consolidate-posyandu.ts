import ExcelJS from "exceljs"
import { readdirSync } from "fs"
import { join } from "path"
import { execSync } from "child_process"

const BASE = "docs/Data Posyandu Kab. Lebak"
const OUTPUT = "docs/POSYANDU_KAB_LEBAK.xlsx"
const OFFICIAL_FILE = "docs/DAFTAR NAMA DESA DAN KELURAHAN.xlsx"

const SKIP_FILES = new Set([
  join(BASE, "KECAMATAN BAYAH/PENDATAAN POSYANDU.xlsx"),
  join(BASE, "PENDATAAN POSYANDU DESA HEGARMANAH.xlsx"),
  join(BASE, "PENDATAAN POSYANDU DS.SUKAJADI KEC.PANGGARANGAN.pdf"),
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
    else if (e.name.endsWith(".xlsx") || e.name.endsWith(".pdf")) results.push(full)
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

interface ParsedPdfRow {
  nama: string
  alamat: string
  desa: string
  kecamatan: string
}

function extractPdfData(filePath: string): ParsedPdfRow[] {
  try {
    const stdout = execSync("pdftotext -layout \"" + filePath + "\" -", {
      encoding: "utf-8",
      timeout: 10000,
    })
    const lines = stdout.split("\n").map(l => l.trim())
    if (lines.length === 0) return []

    let headerIdx = -1
    for (let i = 0; i < lines.length; i++) {
      if (/^NO\s+(?:NAMA\s+)?POSYANDU/i.test(lines[i]) && lines[i].includes("ALAMAT")) {
        headerIdx = i
        break
      }
    }
    if (headerIdx < 0) {
      // try alternative: "NO" immediately followed by "NAMA"
      for (let i = 0; i < lines.length; i++) {
        if (/\bNO\b/.test(lines[i]) && /\bNAMA\b/.test(lines[i]) && /\bALAMAT\b/.test(lines[i])) {
          headerIdx = i
          break
        }
      }
    }
    if (headerIdx < 0) return []

    const rows: ParsedPdfRow[] = []
    let cur: ParsedPdfRow | null = null
    let addrLines: string[] = []

    const pushRow = () => {
      if (cur) {
        const addr = addrLines.join(" ").replace(/\s+/g, " ").trim()
        if (addr) cur.alamat = addr
        if (cur.nama && cur.desa) rows.push(cur)
      }
      cur = null
      addrLines = []
    }

    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue
      if (/^(?:Mengetahui|Kepala|TTD|Kades|[\d\s,]+\s*(?:Juni|Juli|Januari|Februari))/i.test(line)) { pushRow(); continue }

      const noMatch = line.match(/^(\d+)\s+/)
      if (noMatch) {
        pushRow()
        const afterNo = line.slice(noMatch[0].length).trim()
        if (!afterNo) continue
        const parts = afterNo.split(/\s{2,}/)
        if (parts.length < 3) continue
        const kec = parts[parts.length - 1] || ""
        const desa = parts[parts.length - 2] || ""
        const nama = parts[0] || ""
        const alamat = parts.slice(1, parts.length - 2).join(" ")
        cur = { nama, alamat, desa, kecamatan: kec }
        addrLines = [alamat]
      } else if (cur && line.length > 2) {
        addrLines.push(line)
      }
    }
    pushRow()
    return rows
  } catch {
    return []
  }
}

async function main() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(OFFICIAL_FILE)
  const ws = wb.worksheets[0]
  const officialDesaList: OfficialDesa[] = []
  const desaKecMap = new Map<string, OfficialDesa>()
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
  let pdfCount = 0

  const excelFiles = files.filter(f => f.endsWith(".xlsx"))
  const pdfFiles = files.filter(f => f.endsWith(".pdf"))

  // ========== PROCESS EXCEL FILES ==========
  for (const file of excelFiles) {
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

      const cell2 = rowObj.getCell(2)
      if (cell2.isMerged) continue

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
      if (!/^[A-Z0-9\s.\-/]+$/.test(nama) && !nama.match(/^[A-Za-z]/)) continue

      const desaFinal = TYPO_FIX[desaRaw] || desaRaw
      const kecFinal = TYPO_FIX[kecRaw] || kecRaw

      let found = desaKecMap.get(desaFinal + "|" + kecFinal)
      if (!found) {
        let best = ""; let bd = 99
        for (const [key] of desaKecMap) {
          const [dName] = key.split("|")
          const d = levenshtein(desaFinal, dName)
          if (d < bd && d <= 2) { bd = d; best = key }
        }
        if (best) { found = desaKecMap.get(best) }
        else {
          const candidates = officialDesaList.filter(d => d.desaName.toUpperCase() === desaFinal)
          if (candidates.length === 1) found = candidates[0]
          else if (candidates.length > 1) {
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
        desa: found.desaName || desaFinal,
        kecamatan: found.kecName || kecFinal,
        kodeDesa: desaCode,
        kodeKec: kecCode,
      })
    }
  }

  // ========== PROCESS PDF FILES ==========
  for (const file of pdfFiles) {
    if (SKIP_FILES.has(file)) { skippedCount++; continue }

    const rows = extractPdfData(file)
    if (rows.length === 0) {
      console.warn("No PDF data extracted:", file.replace(BASE + "/", ""))
      continue
    }

    pdfCount++
    processedCount++

    let mekarjayaSeq = 0 // for MEKARJAYA typo fix

    for (let idx = 0; idx < rows.length; idx++) {
      const pr = rows[idx]
      let nama = pr.nama.trim()
      let alamat = pr.alamat.trim()
      let desaRaw = norm(pr.desa || "")
      const kecRaw = norm(pr.kecamatan || "")

      if (!nama || !desaRaw || !kecRaw) continue

      if (desaRaw === "MEKARJAYA" && kecRaw === "PANGGARANGAN") {
        mekarjayaSeq++
        // If name starts with "CEMPAKA" but the number doesn't match the sequence, fix it
        if (/^CEMPAKA\s*-\s*\d+$/i.test(nama)) {
          const base = nama.replace(/\d+$/, "").trim()
          // Only fix if the number is different from sequence and not 1 or 5
          const numMatch = nama.match(/(\d+)$/)
          if (numMatch) {
            const num = parseInt(numMatch[1])
            if (num !== mekarjayaSeq && num !== 1 && num !== 5) {
              nama = `${base} ${mekarjayaSeq}`
            }
          }
        }
      }

      const desaPre = TYPO_FIX[desaRaw] || desaRaw
      const kecPre = TYPO_FIX[kecRaw] || kecRaw

      // Fix PDF: desa merged into address (no space between columns)
      if (!desaKecMap.has(desaPre + "|" + kecPre) && desaRaw.length > 5) {
        for (const [key] of desaKecMap) {
          const [dname, kc] = key.split("|")
          if (dname.length >= 4 && kc === kecPre && desaRaw.endsWith(dname)) {
            alamat = alamat || desaRaw.slice(0, -dname.length).trim()
            desaRaw = dname
            break
          }
        }
      }

      const desaFinal = TYPO_FIX[desaRaw] || desaRaw
      const kecFinal = TYPO_FIX[kecRaw] || kecRaw

      let found = desaKecMap.get(desaFinal + "|" + kecFinal)
      if (!found) {
        let best = ""; let bd = 99
        for (const [key] of desaKecMap) {
          const [dName] = key.split("|")
          const d = levenshtein(desaFinal, dName)
          if (d < bd && d <= 2) { bd = d; best = key }
        }
        if (best) found = desaKecMap.get(best)
        else {
          const candidates = officialDesaList.filter(d => d.desaName.toUpperCase() === desaFinal)
          if (candidates.length === 1) found = candidates[0]
          else if (candidates.length > 1) {
            console.warn("Ambiguous desa (PDF):", desaFinal, "in kec:", kecFinal)
          }
        }
      }
      if (!found) { console.warn("Unmatched PDF desa:", desaFinal, "kec:", kecFinal, "from:", file.replace(BASE + "/", "")); continue }

      const kecCode = kecMap.get(found.kecName.toUpperCase()) || found.kecCode
      const desaCode = found.kecCode || ""
      if (!kecCode || !desaCode) continue

      const key = `${nama.toUpperCase()}|${alamat.toUpperCase()}|${found.desaName.toUpperCase()}|${found.kecName.toUpperCase()}`
      if (seen.has(key)) continue
      seen.add(key)

      allData.push({
        nama,
        alamat,
        desa: found.desaName,
        kecamatan: found.kecName,
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
    { header: "NAMA POSYANDU", key: "nama", width: 35 },
    { header: "ALAMAT", key: "alamat", width: 55 },
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
  console.log(`Excel diproses : ${processedCount - pdfCount} (${skippedCount - (pdfFiles.length - pdfCount)} diskip)`)
  console.log(`PDF diproses   : ${pdfCount}`)
  console.log(`Total posyandu : ${allData.length}`)
  console.log(`Desa unik      : ${new Set(allData.map(d => d.desa)).size}`)
  console.log(`Kec unik       : ${byKec.size}`)
  console.log(`Output         : ${OUTPUT}`)
  console.log("")
  console.log("Per Kecamatan:")
  for (const [k, c] of [...byKec].sort()) console.log(`  ${k}: ${c}`)
}

main()
