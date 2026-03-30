import { describe, expect, it } from 'bun:test'
import { letterboxdHandler } from './letterboxd.js'

describe('letterboxdHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://letterboxd.com/dave', true],
      ['https://www.letterboxd.com/dave', true],
      ['https://letterboxd.com/dave/films/', true],
      ['https://letterboxd.com', true],
      ['https://example.com/letterboxd', false],
      ['https://twitter.com/letterboxd', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(letterboxdHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(letterboxdHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS feed for user profile', () => {
      const value = 'https://letterboxd.com/dave'
      const expected = [
        {
          uri: 'https://letterboxd.com/dave/rss/',
          hint: { key: 'letterboxd:diary', label: 'Diary' },
        },
      ]

      expect(letterboxdHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed for user films page', () => {
      const value = 'https://letterboxd.com/dave/films/'
      const expected = [
        {
          uri: 'https://letterboxd.com/dave/rss/',
          hint: { key: 'letterboxd:diary', label: 'Diary' },
        },
      ]

      expect(letterboxdHandler.resolve(value)).toEqual(expected)
    })

    it('should return RSS feed for user list page', () => {
      const value = 'https://letterboxd.com/dave/list/official-top-250-narrative-feature-films/'
      const expected = [
        {
          uri: 'https://letterboxd.com/dave/rss/',
          hint: { key: 'letterboxd:diary', label: 'Diary' },
        },
      ]

      expect(letterboxdHandler.resolve(value)).toEqual(expected)
    })

    it('should normalize www to canonical domain', () => {
      const value = 'https://www.letterboxd.com/dave'
      const expected = [
        {
          uri: 'https://letterboxd.com/dave/rss/',
          hint: { key: 'letterboxd:diary', label: 'Diary' },
        },
      ]

      expect(letterboxdHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for homepage', () => {
      const value = 'https://letterboxd.com'

      expect(letterboxdHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://letterboxd.com/films'

      expect(letterboxdHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for sign-in page', () => {
      const value = 'https://letterboxd.com/sign-in/'

      expect(letterboxdHandler.resolve(value)).toEqual([])
    })
  })
})
