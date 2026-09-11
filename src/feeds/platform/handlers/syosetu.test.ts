import { describe, expect, it } from 'bun:test'
import { syosetuHandler } from './syosetu.js'

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
    it('should return the author feed', () => {
      const value = 'https://mypage.syosetu.com/372556/'
      const expected = [
        {
          uri: 'https://api.syosetu.com/writernovel/372556.Atom',
          hint: { key: 'syosetu:author', label: 'Author' },
        },
      ]

      expect(syosetuHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array without an author id', () => {
      expect(syosetuHandler.resolve('https://mypage.syosetu.com/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(syosetuHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
