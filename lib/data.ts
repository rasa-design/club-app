import fs from 'fs'
import path from 'path'

const dataDir = path.join(process.cwd(), 'data')

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
  grade: number
}

// payments: { [memberId]: { [yearMonth]: boolean } }
// yearMonth format: "2025-04"
export type Payments = Record<string, Record<string, boolean>>

function readJSON<T>(filename: string): T {
  const file = path.join(dataDir, filename)
  const raw = fs.readFileSync(file, 'utf-8')
  return JSON.parse(raw) as T
}

function writeJSON(filename: string, data: unknown): void {
  const file = path.join(dataDir, filename)
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}

export function getEvents(): Event[] {
  return readJSON<Event[]>('events.json')
}

export function saveEvents(events: Event[]): void {
  writeJSON('events.json', events)
}

export function getMembers(): Member[] {
  return readJSON<Member[]>('members.json')
}

export function saveMembers(members: Member[]): void {
  writeJSON('members.json', members)
}

export function getPayments(): Payments {
  return readJSON<Payments>('payments.json')
}

export function savePayments(payments: Payments): void {
  writeJSON('payments.json', payments)
}
