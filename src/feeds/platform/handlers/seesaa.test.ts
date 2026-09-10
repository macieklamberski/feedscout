import { describe, expect, it } from 'bun:test'
import { seesaaHandler } from './seesaa.js'

describe('seesaaHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://jetstream777.seesaa.net', true],
      ['https://blog.example.seesaa.net', true],
      ['https://seesaa.net', false],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
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
  })
})
