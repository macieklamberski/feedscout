import { describe, expect, it } from 'bun:test'
import { goodreadsHandler } from './goodreads.js'

describe('goodreadsHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://www.goodreads.com/user/show/1-otis', true],
      ['https://goodreads.com/review/list/1', true],
      ['https://www.goodreads.com', true],
      ['https://github.com/user/repo', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(goodreadsHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return updates and reviews feeds for user page', () => {
      const value = 'https://www.goodreads.com/user/show/1-otis-chandler'
      const expected = [
        {
          uri: 'https://www.goodreads.com/user/updates_rss/1',
          hint: { key: 'goodreads:updates', label: 'Updates' },
        },
        {
          uri: 'https://www.goodreads.com/review/list_rss/1',
          hint: { key: 'goodreads:reviews', label: 'Reviews' },
        },
      ]

      expect(goodreadsHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for user page with numeric id only', () => {
      const value = 'https://www.goodreads.com/user/show/4082853'
      const expected = [
        {
          uri: 'https://www.goodreads.com/user/updates_rss/4082853',
          hint: { key: 'goodreads:updates', label: 'Updates' },
        },
        {
          uri: 'https://www.goodreads.com/review/list_rss/4082853',
          hint: { key: 'goodreads:reviews', label: 'Reviews' },
        },
      ]

      expect(goodreadsHandler.resolve(value)).toEqual(expected)
    })

    it('should return reviews and updates feeds for review list page', () => {
      const value = 'https://www.goodreads.com/review/list/1-otis-chandler'
      const expected = [
        {
          uri: 'https://www.goodreads.com/review/list_rss/1',
          hint: { key: 'goodreads:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.goodreads.com/user/updates_rss/1',
          hint: { key: 'goodreads:updates', label: 'Updates' },
        },
      ]

      expect(goodreadsHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for review list page with numeric id only', () => {
      const value = 'https://www.goodreads.com/review/list/4082853'
      const expected = [
        {
          uri: 'https://www.goodreads.com/review/list_rss/4082853',
          hint: { key: 'goodreads:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.goodreads.com/user/updates_rss/4082853',
          hint: { key: 'goodreads:updates', label: 'Updates' },
        },
      ]

      expect(goodreadsHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for user page with non-numeric id', () => {
      const value = 'https://www.goodreads.com/user/show/abc-otis'

      expect(goodreadsHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for review list page with non-numeric id', () => {
      const value = 'https://www.goodreads.com/review/list/abc-otis'

      expect(goodreadsHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for root page', () => {
      const value = 'https://www.goodreads.com'

      expect(goodreadsHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for book pages', () => {
      const value = 'https://www.goodreads.com/book/show/5907.The_Hobbit'

      expect(goodreadsHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for author pages', () => {
      const value = 'https://www.goodreads.com/author/show/3354.Haruki_Murakami'

      expect(goodreadsHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for non-feedable paths', () => {
      const values = [
        'https://www.goodreads.com/genres/fiction',
        'https://www.goodreads.com/list/show/1.Best_Books_Ever',
        'https://www.goodreads.com/choiceawards',
      ]

      for (const value of values) {
        expect(goodreadsHandler.resolve(value)).toEqual([])
      }
    })
  })
})
