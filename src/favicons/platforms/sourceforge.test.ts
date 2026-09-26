import { describe, expect, it } from 'bun:test'
import { sourceforgeHandler } from './sourceforge.js'

describe('sourceforgeHandler', () => {
  describe('match', () => {
    it('should return true for a project page', () => {
      expect(sourceforgeHandler.match('https://sourceforge.net/projects/mingw')).toBe(true)
    })

    it('should return false for a non-project path', () => {
      expect(sourceforgeHandler.match('https://sourceforge.net/about')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve the project icon', () => {
      const value = 'https://sourceforge.net/projects/mingw'
      const expected = [{ uri: 'https://a.fsdn.com/allura/p/mingw/icon' }]

      expect(sourceforgeHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a non-project path', () => {
      expect(sourceforgeHandler.resolve('https://sourceforge.net/about')).toEqual([])
    })
  })
})
