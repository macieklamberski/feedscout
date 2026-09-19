import { describe, expect, it } from 'bun:test'
import { v2exHandler } from './v2ex.js'

describe('v2exHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.v2ex.com/'],
      [true, 'https://v2ex.com/'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(v2exHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(v2exHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return index feed for root page', () => {
      const value = 'https://www.v2ex.com/'
      const expected = [
        {
          uri: 'https://www.v2ex.com/index.xml',
          hint: { key: 'v2ex:index', label: 'Index' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should return node feed for node page', () => {
      const value = 'https://www.v2ex.com/go/programmer'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/programmer.xml',
          hint: { key: 'v2ex:node', label: 'Node' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should return member feed for member page', () => {
      const value = 'https://www.v2ex.com/member/livid'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/member/livid.xml',
          hint: { key: 'v2ex:member', label: 'Member' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should return tab feed for tab page', () => {
      const value = 'https://www.v2ex.com/?tab=tech'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/tab/tech.xml',
          hint: { key: 'v2ex:tab', label: 'Tab' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should return index feed for root without www', () => {
      const value = 'https://v2ex.com/'
      const expected = [
        {
          uri: 'https://www.v2ex.com/index.xml',
          hint: { key: 'v2ex:index', label: 'Index' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for unrecognized paths', () => {
      const value = 'https://www.v2ex.com/t/12345'

      expect(v2exHandler.resolve(value)).toEqual([])
    })

    it('should return tab feed for /t/{id} page with tab query', () => {
      const value = 'https://www.v2ex.com/t/12345?tab=tech'
      const expected = [
        {
          uri: 'https://www.v2ex.com/feed/tab/tech.xml',
          hint: { key: 'v2ex:tab', label: 'Tab' },
        },
      ]

      expect(v2exHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
