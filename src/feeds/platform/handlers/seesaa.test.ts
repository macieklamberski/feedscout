import { describe, expect, it } from 'bun:test'
import { seesaaHandler } from './seesaa.js'

describe('seesaaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://jetstream777.seesaa.net'],
      [true, 'https://blog.example.seesaa.net'],
      [false, 'https://seesaa.net'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(seesaaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(seesaaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS 2.0 and RDF feeds for blog', () => {
      const value = 'https://jetstream777.seesaa.net'
      const expected = [
        {
          uri: 'https://jetstream777.seesaa.net/index20.rdf',
          hint: { key: 'seesaa:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: 'https://jetstream777.seesaa.net/index.rdf',
          hint: { key: 'seesaa:posts-rdf', label: 'Posts (RDF)' },
        },
      ]

      expect(seesaaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://jetstream777.seesaa.net/article/123.html'
      const expected = [
        {
          uri: 'https://jetstream777.seesaa.net/index20.rdf',
          hint: { key: 'seesaa:posts-rss2', label: 'Posts (RSS 2.0)' },
        },
        {
          uri: 'https://jetstream777.seesaa.net/index.rdf',
          hint: { key: 'seesaa:posts-rdf', label: 'Posts (RDF)' },
        },
      ]

      expect(seesaaHandler.resolve(value)).toEqual(expected)
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
