import { describe, expect, it } from 'bun:test'
import { lobstersHandler } from './lobsters.js'

describe('lobstersHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://lobste.rs/', true],
      ['https://lobste.rs/newest', true],
      ['https://lobste.rs/t/programming', true],
      ['https://lobste.rs/t/programming,security', true],
      ['https://lobste.rs/domains/github.com', true],
      ['https://example.com/lobsters', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(lobstersHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return main RSS feed for homepage', () => {
      const value = 'https://lobste.rs/'
      const expected = [
        { uri: 'https://lobste.rs/rss', hint: { key: 'lobsters:stories', label: 'Stories' } },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return newest RSS feed for newest page', () => {
      const value = 'https://lobste.rs/newest'
      const expected = [
        { uri: 'https://lobste.rs/newest.rss', hint: { key: 'lobsters:newest', label: 'Newest' } },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag RSS feed for single tag page', () => {
      const value = 'https://lobste.rs/t/programming'
      const expected = [
        { uri: 'https://lobste.rs/t/programming.rss', hint: { key: 'lobsters:tag', label: 'Tag' } },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag RSS feed for multiple tags page', () => {
      const value = 'https://lobste.rs/t/programming,security'
      const expected = [
        {
          uri: 'https://lobste.rs/t/programming,security.rss',
          hint: { key: 'lobsters:tag', label: 'Tag' },
        },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return domain RSS feed for domain page', () => {
      const value = 'https://lobste.rs/domains/github.com'
      const expected = [
        {
          uri: 'https://lobste.rs/domains/github.com.rss',
          hint: { key: 'lobsters:domain', label: 'Domain' },
        },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return user stories feed for user page', () => {
      const value = 'https://lobste.rs/~pushcx'
      const expected = [
        {
          uri: 'https://lobste.rs/~pushcx/stories.rss',
          hint: { key: 'lobsters:stories', label: 'Stories' },
        },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return top stories feed for top page', () => {
      const value = 'https://lobste.rs/top'
      const expected = [
        { uri: 'https://lobste.rs/top/rss', hint: { key: 'lobsters:top', label: 'Top stories' } },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return top stories feed with period', () => {
      const value = 'https://lobste.rs/top/1d'
      const expected = [
        {
          uri: 'https://lobste.rs/top/1d/rss',
          hint: { key: 'lobsters:top', label: 'Top stories' },
        },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })

    it('should return comments feed for comments page', () => {
      const value = 'https://lobste.rs/comments'
      const expected = [
        {
          uri: 'https://lobste.rs/comments.rss',
          hint: { key: 'lobsters:comments', label: 'Comments' },
        },
      ]

      expect(lobstersHandler.resolve(value)).toEqual(expected)
    })
  })
})
