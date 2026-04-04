import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { gradeLabel, currentSchoolYear } from '../grade'

describe('gradeLabel', () => {
  it('小学生の学年を正しく返す', () => {
    expect(gradeLabel(4)).toBe('小4')
    expect(gradeLabel(5)).toBe('小5')
    expect(gradeLabel(6)).toBe('小6')
  })

  it('中学生の学年を正しく返す', () => {
    expect(gradeLabel(7)).toBe('中1')
    expect(gradeLabel(8)).toBe('中2')
    expect(gradeLabel(9)).toBe('中3')
  })

  it('高校生の学年を正しく返す', () => {
    expect(gradeLabel(10)).toBe('高1')
    expect(gradeLabel(11)).toBe('高2')
    expect(gradeLabel(12)).toBe('高3')
  })

  it('大学生の学年を正しく返す', () => {
    expect(gradeLabel(13)).toBe('大1')
    expect(gradeLabel(14)).toBe('大2')
    expect(gradeLabel(15)).toBe('大3')
    expect(gradeLabel(16)).toBe('大4')
  })

  it('定義外の値は{n}年として返す', () => {
    expect(gradeLabel(99)).toBe('99年')
    expect(gradeLabel(1)).toBe('1年')
  })
})

describe('currentSchoolYear', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('4月は今年度を返す', () => {
    vi.setSystemTime(new Date('2025-04-01'))
    expect(currentSchoolYear()).toBe(2025)
  })

  it('3月は前年度を返す', () => {
    vi.setSystemTime(new Date('2025-03-31'))
    expect(currentSchoolYear()).toBe(2024)
  })

  it('12月は今年度を返す', () => {
    vi.setSystemTime(new Date('2025-12-01'))
    expect(currentSchoolYear()).toBe(2025)
  })

  it('1月は前年度を返す', () => {
    vi.setSystemTime(new Date('2026-01-15'))
    expect(currentSchoolYear()).toBe(2025)
  })
})
