import { describe, it, expect } from 'vitest'
import { toHalfWidth, parseRecord, formatRecord } from '../record'

describe('toHalfWidth', () => {
  it('全角数字を半角に変換する', () => {
    expect(toHalfWidth('２')).toBe('2')
    expect(toHalfWidth('１０')).toBe('10')
    expect(toHalfWidth('０１２３４５６７８９')).toBe('0123456789')
  })

  it('半角数字はそのまま返す', () => {
    expect(toHalfWidth('210')).toBe('210')
  })

  it('全角と半角が混在していても変換する', () => {
    expect(toHalfWidth('２m１０cm')).toBe('2m10cm')
  })

  it('空文字は空文字を返す', () => {
    expect(toHalfWidth('')).toBe('')
  })
})

describe('parseRecord', () => {
  it('"2m10cm" を正しくパースする', () => {
    expect(parseRecord('2m10cm')).toEqual({ m: '2', cm: '10' })
  })

  it('"3m50cm" を正しくパースする', () => {
    expect(parseRecord('3m50cm')).toEqual({ m: '3', cm: '50' })
  })

  it('空文字は { m: "", cm: "" } を返す', () => {
    expect(parseRecord('')).toEqual({ m: '', cm: '' })
  })

  it('不正なフォーマットは { m: "", cm: "" } を返す', () => {
    expect(parseRecord('2.10')).toEqual({ m: '', cm: '' })
    expect(parseRecord('210cm')).toEqual({ m: '', cm: '' })
    expect(parseRecord('abc')).toEqual({ m: '', cm: '' })
  })
})

describe('formatRecord', () => {
  it('m と cm を "2m10cm" 形式に結合する', () => {
    expect(formatRecord('2', '10')).toBe('2m10cm')
  })

  it('全角を半角に変換して結合する', () => {
    expect(formatRecord('２', '１０')).toBe('2m10cm')
  })

  it('m が空なら空文字を返す', () => {
    expect(formatRecord('', '10')).toBe('')
  })

  it('cm が空なら空文字を返す', () => {
    expect(formatRecord('2', '')).toBe('')
  })

  it('両方空なら空文字を返す', () => {
    expect(formatRecord('', '')).toBe('')
  })

  it('数字以外の文字を除去して結合する', () => {
    expect(formatRecord('2m', '10cm')).toBe('2m10cm')
  })
})
