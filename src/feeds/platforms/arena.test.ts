import { describe, expect, it } from 'bun:test'
import { arenaHandler } from './arena.js'

describe('arenaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://www.are.na/charles-broskoski'],
      [true, 'https://are.na/meg-miller/good-sign-offs'],
      [true, 'https://are.na'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
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

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
