import { describe, expect, it } from 'bun:test'
import { noteHandler } from './note.js'

describe('noteHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://note.com/tsukasa_yamato', true],
      ['https://www.note.com/user', true],
      ['https://note.com', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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

    it('should return empty array for root path', () => {
      const value = 'https://note.com/'

      expect(noteHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://note.com/login'

      expect(noteHandler.resolve(value)).toEqual([])
    })
  })
})
