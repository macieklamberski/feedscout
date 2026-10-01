import { describe, expect, it } from 'bun:test'
import { parseSyosetuUrl, type SyosetuUrl, syosetuHandler } from './syosetu.js'

describe('parseSyosetuUrl', () => {
  it('should return the writer for a writer page', () => {
    const expected: SyosetuUrl = { kind: 'writer', writerId: '12345' }

    expect(parseSyosetuUrl('https://mypage.syosetu.com/12345/')).toEqual(expected)
  })

  it('should return undefined for a page without a writer id', () => {
    expect(parseSyosetuUrl('https://mypage.syosetu.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSyosetuUrl('https://example.com/12345/')).toBeUndefined()
  })
})

describe('syosetuHandler', () => {
  describe('match', () => {
    it('should match an author page', () => {
      expect(syosetuHandler.match('https://mypage.syosetu.com/372556/')).toBe(true)
    })

    it('should not match a novel page', () => {
      expect(syosetuHandler.match('https://ncode.syosetu.com/n4830bu/')).toBe(false)
    })

    it('should not match an author host without an id', () => {
      expect(syosetuHandler.match('https://mypage.syosetu.com/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(syosetuHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Syosetu', () => {
      expect(syosetuHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the author and activity feeds', () => {
      const value = 'https://mypage.syosetu.com/372556/'
      const expected = [
        {
          uri: 'https://api.syosetu.com/writernovel/372556.Atom',
          hint: { key: 'syosetu:author', label: 'Author' },
        },
        {
          uri: 'https://api.syosetu.com/writer/372556.Atom',
          hint: { key: 'syosetu:activity', label: 'Activity' },
        },
      ]

      expect(syosetuHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array without an author id', () => {
      expect(syosetuHandler.resolve('https://mypage.syosetu.com/')).toEqual([])
    })
  })
})
