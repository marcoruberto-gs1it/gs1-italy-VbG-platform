/*
 * Esportazione CSV per Excel in italiano: separatore ";", virgola decimale, BOM UTF-8
 * (così accenti e simboli si leggono correttamente all'apertura).
 */
export type CsvColumn<T> = { label: string; value: (row: T) => string | number | null | undefined }

const cell = (v: string | number | null | undefined) => {
  if (v == null) return ''
  const s = typeof v === 'number' ? v.toLocaleString('it-IT', { useGrouping: false, maximumFractionDigits: 4 }) : v
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => cell(c.label)).join(';'), ...rows.map((r) => columns.map((c) => cell(c.value(r))).join(';'))]
  return '﻿' + lines.join('\r\n') + '\r\n'
}

/** Avvia lo scaricamento di un file di testo generato nel browser. */
export function download(filename: string, content: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
