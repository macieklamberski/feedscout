import { describe, expect, it } from 'bun:test'
import { noteHandler } from './note.js'

describe('noteHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://note.com/tsukasa_yamato'],
      [true, 'https://www.note.com/user'],
      [true, 'https://note.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(noteHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(noteHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://note.com/tsukasa_yamato'
      const expected = [
        {
          uri: 'https://note.com/tsukasa_yamato/rss',
          hint: { key: 'note:blog', label: 'Blog' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://note.com/tsukasa_yamato/n/some-note'
      const expected = [
        {
          uri: 'https://note.com/tsukasa_yamato/rss',
          hint: { key: 'note:blog', label: 'Blog' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for hashtag page', () => {
      const value = 'https://note.com/hashtag/AI'
      const expected = [
        {
          uri: 'https://note.com/hashtag/AI/rss',
          hint: { key: 'note:hashtag', label: 'Hashtag' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for magazine page', () => {
      const value = 'https://note.com/notemag/m/m7244518f06ae'
      const expected = [
        {
          uri: 'https://note.com/notemag/m/m7244518f06ae/rss',
          hint: { key: 'note:magazine', label: 'Magazine' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return featured feed for root path', () => {
      const value = 'https://note.com/'
      const expected = [
        {
          uri: 'https://note.com/rss',
          hint: { key: 'note:featured', label: 'Featured' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      const values = [
        'https://note.com/login',
        'https://note.com/about',
        'https://note.com/api',
        'https://note.com/explore',
        'https://note.com/hashtag',
        'https://note.com/help',
        'https://note.com/m',
        'https://note.com/n',
        'https://note.com/premium',
        'https://note.com/privacy',
        'https://note.com/ranking',
        'https://note.com/search',
        'https://note.com/settings',
        'https://note.com/signup',
        'https://note.com/terms',
      ]

      for (const value of values) {
        expect(noteHandler.resolve(value)).toEqual([])
      }
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
