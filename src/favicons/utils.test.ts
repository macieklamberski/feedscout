import { describe, expect, it } from 'bun:test'
import { parseBodyJson } from './utils.js'

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
