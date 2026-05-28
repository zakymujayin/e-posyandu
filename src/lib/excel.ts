import ExcelJS from "exceljs"

export function createWorkbook() {
  return new ExcelJS.Workbook()
}

export function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FF1E3A5F" } }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFBDD7E7" },
    }
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF8BA8C4" } },
    }
    cell.alignment = { vertical: "middle", wrapText: true }
  })
  row.height = 20
}

export async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
