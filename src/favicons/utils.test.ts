import { describe, expect, it } from 'bun:test'
import { isNonEmptyString, parseBodyJson } from './utils.js'

describe('parseBodyJson', () => {
  it('should parse valid JSON string', () => {
    expect(parseBodyJson('{"key":"value"}')).toEqual({ key: 'value' })
  })

  it('should parse JSON arrays', () => {
    expect(parseBodyJson('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('should throw on invalid JSON string', () => {
    const throwing = () => parseBodyJson('not-json')

    expect(throwing).toThrow()
  })

  it('should throw when body is a ReadableStream', () => {
    const value = new ReadableStream()
    const throwing = () => parseBodyJson(value)

    expect(throwing).toThrow()
  })

  it('should throw on empty string', () => {
    const throwing = () => parseBodyJson('')

    expect(throwing).toThrow()
  })
})

describe('isNonEmptyString', () => {
  it('should return true for non-empty strings', () => {
    expect(isNonEmptyString('hello')).toBe(true)
    expect(isNonEmptyString('https://example.com/avatar.png')).toBe(true)
  })

  it('should return false for empty string', () => {
    expect(isNonEmptyString('')).toBe(false)
  })

  it('should return false for non-string values', () => {
    expect(isNonEmptyString(null)).toBe(false)
    expect(isNonEmptyString(undefined)).toBe(false)
    expect(isNonEmptyString(42)).toBe(false)
    expect(isNonEmptyString([])).toBe(false)
    expect(isNonEmptyString({})).toBe(false)
  })

  it('should return true for whitespace-only strings', () => {
    expect(isNonEmptyString(' ')).toBe(true)
  })
})
