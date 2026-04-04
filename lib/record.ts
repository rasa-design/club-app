// 記録入力ユーティリティ（全角→半角変換・パース）

// 全角数字→半角数字変換
export function toHalfWidth(str: string): string {
  return str.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
}

// "2m10cm" → { m: '2', cm: '10' }
export function parseRecord(record: string): { m: string; cm: string } {
  const match = record.match(/^(\d+)m(\d+)cm$/)
  if (match) return { m: match[1], cm: match[2] }
  return { m: '', cm: '' }
}

// { m: '2', cm: '10' } → "2m10cm"（どちらか空なら空文字）
export function formatRecord(m: string, cm: string): string {
  const mH = toHalfWidth(m).replace(/\D/g, '')
  const cmH = toHalfWidth(cm).replace(/\D/g, '')
  return mH !== '' && cmH !== '' ? `${mH}m${cmH}cm` : ''
}
