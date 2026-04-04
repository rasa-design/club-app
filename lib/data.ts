import { readStorage, writeStorage } from '@/lib/storage'
import { currentSchoolYear as _currentSchoolYear } from '@/lib/grade'

export type Event = {
  id: string
  title: string
  date: string
  endDate: string
  location: string
  description: string
}

export type Member = {
  id: string
  name: string
  grade: number // 4=小4, 5=小5, 6=小6, 7=中1, 8=中2, 9=中3, 10=高1, 11=高2, 12=高3, 13=大1, 14=大2, 15=大3, 16=大4
}

// payments: { [memberId]: { [yearMonth]: true | '退会' } }
export type PaymentStatus = true | '退会'
export type Payments = Record<string, Record<string, PaymentStatus>>

// 年度別メンバーデータ: { [schoolYear]: Member[] }
export type MembersData = Record<string, Member[]>

// クライアント共通ユーティリティは lib/grade.ts から再エクスポート
export { GRADE_OPTIONS, gradeLabel, currentSchoolYear } from '@/lib/grade'

export async function getEvents(): Promise<Event[]> {
  return readStorage<Event[]>('events', [])
}

export async function saveEvents(events: Event[]): Promise<void> {
  return writeStorage('events', events)
}

export async function getMembersData(): Promise<MembersData> {
  return readStorage<MembersData>('members', {})
}

export async function saveMembersData(data: MembersData): Promise<void> {
  return writeStorage('members', data)
}

export async function getMembers(year: number): Promise<Member[]> {
  const data = await getMembersData()
  return data[String(year)] ?? []
}

// メンバーが存在する最新の年度を返す
export async function getLatestMembersYear(): Promise<number> {
  const data = await getMembersData()
  const years = Object.keys(data)
    .map(Number)
    .filter((y) => data[String(y)].length > 0)
    .sort((a, b) => b - a)
  return years[0] ?? _currentSchoolYear()
}

export async function getPayments(): Promise<Payments> {
  return readStorage<Payments>('payments', {})
}

export async function savePayments(payments: Payments): Promise<void> {
  return writeStorage('payments', payments)
}

// 練習日: { [date: "YYYY-MM-DD"]: PracticeSlot[] }
export type PracticeSlot = { id: string; start: string; end: string }
export type Practices = Record<string, PracticeSlot[]>

export async function getPractices(): Promise<Practices> {
  return readStorage<Practices>('practices', {})
}

export async function savePractices(practices: Practices): Promise<void> {
  return writeStorage('practices', practices)
}

// 参加記録: { [date: "YYYY-MM-DD"]: { [memberId]: { start: string; end: string } } }
export type AttendanceRecord = { start: string; end: string }
export type Attendance = Record<string, Record<string, AttendanceRecord>>

export async function getAttendance(): Promise<Attendance> {
  return readStorage<Attendance>('attendance', {})
}

export async function saveAttendance(attendance: Attendance): Promise<void> {
  return writeStorage('attendance', attendance)
}

// 保険料: { [memberId]: { [schoolYear]: number | '退会' } }
// number = 支払月 (1〜12)
export type InsurancePaidStatus = number | '退会'
export type InsurancePayments = Record<string, Record<string, InsurancePaidStatus>>

export async function getInsurancePayments(): Promise<InsurancePayments> {
  return readStorage<InsurancePayments>('insurance', {})
}

export async function saveInsurancePayments(data: InsurancePayments): Promise<void> {
  return writeStorage('insurance', data)
}

// 大会参加: { [eventId]: memberId[] }
export type EventAttendance = Record<string, string[]>

export async function getEventAttendance(): Promise<EventAttendance> {
  return readStorage<EventAttendance>('event-attendance', {})
}

export async function saveEventAttendance(data: EventAttendance): Promise<void> {
  return writeStorage('event-attendance', data)
}

// ポール: [{ id, size }]
export type Pole = { id: string; size: string }
export type Poles = Pole[]

export async function getPoles(): Promise<Poles> {
  return readStorage<Poles>('poles', [])
}

export async function savePoles(poles: Poles): Promise<void> {
  return writeStorage('poles', poles)
}
