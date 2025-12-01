import fs from 'fs/promises'

export async function parsePipeCsvFile(filePath) {
  const text = (await fs.readFile(filePath, 'utf8')).trim()
  return parsePipeCsvAllRows(text)
}

export function parsePipeCsvAllRows(text) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) throw new Error('Input CSV must contain at least header and one row')
  const headerParts = lines[0].split('|').map(h => h.replace(/^"|"$/g, '').trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const valueParts = lines[i].split('|').map(v => v.replace(/^"|"$/g, '').trim())
    const obj = {}
    headerParts.forEach((h, idx) => {
      obj[h] = valueParts[idx] !== undefined ? valueParts[idx] : ''
    })
    rows.push(obj)
  }
  return rows
}

export function buildCompositeKey(obj, fields) {
  return fields.map((f) => String(obj[f] || '')).join('|')
}
