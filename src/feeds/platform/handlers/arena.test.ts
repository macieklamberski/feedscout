import { describe, expect, it } from 'bun:test'
import { arenaHandler } from './arena.js'

describe('arenaHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://www.are.na/charles-broskoski', true],
      ['https://are.na/meg-miller/good-sign-offs', true],
      ['https://are.na', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(arenaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(arenaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user profile', () => {
      const value = 'https://www.are.na/charles-broskoski'
      const expected = [
        {
          uri: 'https://www.are.na/charles-broskoski/feed/rss',
          hint: { key: 'arena:profile', label: 'Profile' },
        },
      ]

      expect(arenaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for channel', () => {
      const value = 'https://www.are.na/meg-miller/good-sign-offs'
      const expected = [
        {
          uri: 'https://www.are.na/meg-miller/good-sign-offs/feed/rss',
          hint: { key: 'arena:channel', label: 'Channel' },
        },
      ]

      expect(arenaHandler.resolve(value)).toEqual(expected)
    })

    it('should return channel feed regardless of subpath', () => {
      const value = 'https://www.are.na/meg-miller/good-sign-offs/some-block-slug'
      const expected = [
        {
          uri: 'https://www.are.na/meg-miller/good-sign-offs/feed/rss',
          hint: { key: 'arena:channel', label: 'Channel' },
        },
      ]

      expect(arenaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://www.are.na/'

      expect(arenaHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://www.are.na/explore'

      expect(arenaHandler.resolve(value)).toEqual([])
    })

    it('should return editorial feed for /editorial', () => {
      const value = 'https://www.are.na/editorial'
      const expected = [
        {
          uri: 'https://www.are.na/editorial/feed/rss',
          hint: { key: 'arena:editorial', label: 'Editorial' },
        },
      ]

      expect(arenaHandler.resolve(value)).toEqual(expected)
    })

    it('should return editorial feed for editorial article slug', () => {
      const value = 'https://www.are.na/editorial/learning-to-float'
      const expected = [
        {
          uri: 'https://www.are.na/editorial/feed/rss',
          hint: { key: 'arena:editorial', label: 'Editorial' },
        },
      ]

      expect(arenaHandler.resolve(value)).toEqual(expected)
    })
  })
})
