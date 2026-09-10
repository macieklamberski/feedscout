import { describe, expect, it } from 'bun:test'
import { bearblogHandler } from './bearblog.js'

describe('bearblogHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://herman.bearblog.dev', true],
      ['https://blog.example.bearblog.dev', true],
      ['https://bearblog.dev', true],
      ['https://www.bearblog.dev', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(bearblogHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(bearblogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return Atom and RSS feeds for blog', () => {
      const value = 'https://herman.bearblog.dev'
      const expected = [
        {
          uri: 'https://herman.bearblog.dev/feed/',
          hint: { key: 'bearblog:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://herman.bearblog.dev/feed/?type=rss',
          hint: { key: 'bearblog:posts-rss', label: 'Posts (RSS)' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://herman.bearblog.dev/some-article-slug'
      const expected = [
        {
          uri: 'https://herman.bearblog.dev/feed/',
          hint: { key: 'bearblog:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://herman.bearblog.dev/feed/?type=rss',
          hint: { key: 'bearblog:posts-rss', label: 'Posts (RSS)' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return apex discover feeds for bearblog.dev', () => {
      const value = 'https://bearblog.dev/'
      const expected = [
        {
          uri: 'https://bearblog.dev/discover/feed/',
          hint: { key: 'bearblog:discover-atom', label: 'Trending (Atom)' },
        },
        {
          uri: 'https://bearblog.dev/discover/feed/?type=rss',
          hint: { key: 'bearblog:discover-rss', label: 'Trending (RSS)' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag-filtered and main feeds when q query param is set', () => {
      const value = 'https://herman.bearblog.dev/blog/?q=tips'
      const expected = [
        {
          uri: 'https://herman.bearblog.dev/feed/?q=tips',
          hint: { key: 'bearblog:tag-atom', label: 'Tag (Atom)' },
        },
        {
          uri: 'https://herman.bearblog.dev/feed/?type=rss&q=tips',
          hint: { key: 'bearblog:tag-rss', label: 'Tag (RSS)' },
        },
        {
          uri: 'https://herman.bearblog.dev/feed/',
          hint: { key: 'bearblog:posts-atom', label: 'Posts (Atom)' },
        },
        {
          uri: 'https://herman.bearblog.dev/feed/?type=rss',
          hint: { key: 'bearblog:posts-rss', label: 'Posts (RSS)' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })
  })
})
