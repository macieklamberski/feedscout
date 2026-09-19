import { describe, expect, it } from 'bun:test'
import { doubanHandler } from './douban.js'

describe('doubanHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.douban.com/'],
      [true, 'https://douban.com/'],
      [true, 'https://book.douban.com/'],
      [true, 'https://movie.douban.com/'],
      [true, 'https://music.douban.com/'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(doubanHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(doubanHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return interests, reviews, and notes feeds for user page', () => {
      const value = 'https://www.douban.com/people/ahbei/'
      const expected = [
        {
          uri: 'https://www.douban.com/feed/people/ahbei/interests',
          hint: { key: 'douban:interests', label: 'Interests' },
        },
        {
          uri: 'https://www.douban.com/feed/people/ahbei/reviews',
          hint: { key: 'douban:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.douban.com/feed/people/ahbei/notes',
          hint: { key: 'douban:notes', label: 'Notes' },
        },
      ]

      expect(doubanHandler.resolve(value)).toEqual(expected)
    })

    it('should return subject reviews feed for subject page', () => {
      const value = 'https://book.douban.com/subject/1084336/'
      const expected = [
        {
          uri: 'https://www.douban.com/feed/subject/1084336/reviews',
          hint: { key: 'douban:subjectReviews', label: 'Subject reviews' },
        },
      ]

      expect(doubanHandler.resolve(value)).toEqual(expected)
    })

    it('should return category review feeds for root page', () => {
      const value = 'https://www.douban.com/'
      const expected = [
        {
          uri: 'https://www.douban.com/feed/review/book',
          hint: { key: 'douban:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.douban.com/feed/review/movie',
          hint: { key: 'douban:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.douban.com/feed/review/music',
          hint: { key: 'douban:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.douban.com/feed/review/drama',
          hint: { key: 'douban:reviews', label: 'Reviews' },
        },
      ]

      expect(doubanHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for unrecognized paths', () => {
      const value = 'https://www.douban.com/group/explore'

      expect(doubanHandler.resolve(value)).toEqual([])
    })

    it('should handle user page from subdomain', () => {
      const value = 'https://movie.douban.com/people/ahbei/'
      const expected = [
        {
          uri: 'https://www.douban.com/feed/people/ahbei/interests',
          hint: { key: 'douban:interests', label: 'Interests' },
        },
        {
          uri: 'https://www.douban.com/feed/people/ahbei/reviews',
          hint: { key: 'douban:reviews', label: 'Reviews' },
        },
        {
          uri: 'https://www.douban.com/feed/people/ahbei/notes',
          hint: { key: 'douban:notes', label: 'Notes' },
        },
      ]

      expect(doubanHandler.resolve(value)).toEqual(expected)
    })

    it('should handle subject page from movie subdomain', () => {
      const value = 'https://movie.douban.com/subject/36873464/'
      const expected = [
        {
          uri: 'https://www.douban.com/feed/subject/36873464/reviews',
          hint: { key: 'douban:subjectReviews', label: 'Subject reviews' },
        },
      ]

      expect(doubanHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
