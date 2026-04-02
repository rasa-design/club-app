// クライアント・サーバー共通のユーティリティ（fs/path を使わない）

export const GRADE_OPTIONS: { value: number; label: string }[] = [
  { value: 4,  label: '小4' },
  { value: 5,  label: '小5' },
  { value: 6,  label: '小6' },
  { value: 7,  label: '中1' },
  { value: 8,  label: '中2' },
  { value: 9,  label: '中3' },
  { value: 10, label: '高1' },
  { value: 11, label: '高2' },
  { value: 12, label: '高3' },
  { value: 13, label: '大1' },
  { value: 14, label: '大2' },
  { value: 15, label: '大3' },
  { value: 16, label: '大4' },
]

export function gradeLabel(grade: number): string {
  const found = GRADE_OPTIONS.find((o) => o.value === grade)
  return found ? found.label : `${grade}年`
}

export function currentSchoolYear(): number {
  const today = new Date()
  return today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
}
