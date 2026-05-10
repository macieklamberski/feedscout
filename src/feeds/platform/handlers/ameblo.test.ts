import { describe, expect, it } from 'bun:test'
import { amebloHandler } from './ameblo.js'

describe('amebloHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://ameblo.jp/shibuya', true],
      ['https://www.ameblo.jp/user', true],
      ['https://ameblo.jp', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(amebloHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(amebloHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS 2.0, Atom, and RDF feeds for blog', () => {
      const value = 'https://ameblo.jp/shibuya'
      const expected = [
        {
          uri: 'https://ameblo.jp/shibuya/rss20.xml',
          hint: { key: 'ameblo:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://ameblo.jp/shibuya/atom.xml',
          hint: { key: 'ameblo:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://rssblog.ameba.jp/shibuya/rss.html',
          hint: { key: 'ameblo:posts-rdf', label: 'Posts (RDF)' },
        },
      ]

      expect(amebloHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of subpath', () => {
      const value = 'https://ameblo.jp/shibuya/entry-12345.html'
      const expected = [
        {
          uri: 'https://ameblo.jp/shibuya/rss20.xml',
          hint: { key: 'ameblo:posts-rss', label: 'Posts (RSS)' },
        },
        {
          uri: 'https://ameblo.jp/shibuya/atom.xml',
          hint: { key: 'ameblo:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://rssblog.ameba.jp/shibuya/rss.html',
          hint: { key: 'ameblo:posts-rdf', label: 'Posts (RDF)' },
        },
      ]

      expect(amebloHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://ameblo.jp/'

      expect(amebloHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://ameblo.jp/hashtag'

      expect(amebloHandler.resolve(value)).toEqual([])
    })
  })
})
