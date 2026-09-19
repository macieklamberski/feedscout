import { describe, expect, it } from 'bun:test'
import { ximalayaHandler } from './ximalaya.js'

describe('ximalayaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.ximalaya.com/album/203355'],
      [true, 'https://ximalaya.com/album/203355'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(ximalayaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(ximalayaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return XML feed URL for album page', () => {
      const value = 'https://www.ximalaya.com/album/203355'
      const expected = [
        {
          uri: 'https://www.ximalaya.com/album/203355.xml',
          hint: { key: 'ximalaya:album', label: 'Album' },
        },
      ]

      expect(ximalayaHandler.resolve(value)).toEqual(expected)
    })

    it('should handle album page with trailing path', () => {
      const value = 'https://www.ximalaya.com/album/203355/track/12345'
      const expected = [
        {
          uri: 'https://www.ximalaya.com/album/203355.xml',
          hint: { key: 'ximalaya:album', label: 'Album' },
        },
      ]

      expect(ximalayaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-album pages', () => {
      const value = 'https://www.ximalaya.com/category/1'

      expect(ximalayaHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for root page', () => {
      const value = 'https://www.ximalaya.com/'

      expect(ximalayaHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for album with non-numeric id', () => {
      const value = 'https://www.ximalaya.com/album/abc'

      expect(ximalayaHandler.resolve(value)).toEqual([])
    })

    it('should match legacy /{userid}/album/{id} form', () => {
      const value = 'https://www.ximalaya.com/61425525/album/6912905'
      const expected = [
        {
          uri: 'https://www.ximalaya.com/album/6912905.xml',
          hint: { key: 'ximalaya:album', label: 'Album' },
        },
      ]

      expect(ximalayaHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
