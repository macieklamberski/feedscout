import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type BearblogUrl, bearblogHandler, parseBearblogUrl } from './bearblog.js'

describe('parseBearblogUrl', () => {
  it('should return the discover page for the apex host', () => {
    const expected: BearblogUrl = { kind: 'discover' }

    expect(parseBearblogUrl('https://bearblog.dev/')).toEqual(expected)
  })

  it('should return the blog for a subdomain', () => {
    const expected: BearblogUrl = { kind: 'blog', tag: undefined }

    expect(parseBearblogUrl('https://herman.bearblog.dev/')).toEqual(expected)
  })

  it('should return the blog with its tag for a tag filter', () => {
    const expected: BearblogUrl = { kind: 'blog', tag: 'python' }

    expect(parseBearblogUrl('https://herman.bearblog.dev/blog/?q=python')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseBearblogUrl('https://example.com/')).toBeUndefined()
  })
})

describe('bearblogHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.bearblog.dev'],
      [true, 'https://blog.example.bearblog.dev'],
      [true, 'https://bearblog.dev'],
      [true, 'https://www.bearblog.dev'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(bearblogHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(bearblogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(bearblogHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return Atom and RSS feeds for blog', () => {
      const value = 'https://alice.bearblog.dev'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bearblog.dev/feed/',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.bearblog.dev/feed/?type=rss',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URLs regardless of path', () => {
      const value = 'https://alice.bearblog.dev/some-article-slug'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bearblog.dev/feed/',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.bearblog.dev/feed/?type=rss',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return apex discover feeds for bearblog.dev', () => {
      const value = 'https://bearblog.dev/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://bearblog.dev/discover/feed/',
          hint: { key: 'bearblog:discover', label: 'Trending', format: 'atom' },
        },
        {
          uri: 'https://bearblog.dev/discover/feed/?type=rss',
          hint: { key: 'bearblog:discover', label: 'Trending', format: 'rss' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag-filtered and main feeds when q query param is set', () => {
      const value = 'https://alice.bearblog.dev/blog/?q=tips'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.bearblog.dev/feed/?q=tips',
          hint: { key: 'bearblog:tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://alice.bearblog.dev/feed/?type=rss&q=tips',
          hint: { key: 'bearblog:tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'https://alice.bearblog.dev/feed/',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://alice.bearblog.dev/feed/?type=rss',
          hint: { key: 'bearblog:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(bearblogHandler.resolve(value)).toEqual(expected)
    })
  })
})
