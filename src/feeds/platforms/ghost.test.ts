import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type GhostUrl, ghostHandler, parseGhostUrl } from './ghost.js'

describe('parseGhostUrl', () => {
  it('should return the tag for a tag page', () => {
    const value = 'https://blog.ghost.io/tag/news/'
    const expected: GhostUrl = { kind: 'tag', tag: 'news' }

    expect(parseGhostUrl(value)).toEqual(expected)
  })

  it('should return the author for an author page', () => {
    const value = 'https://blog.ghost.io/author/jane/'
    const expected: GhostUrl = { kind: 'author', author: 'jane' }

    expect(parseGhostUrl(value)).toEqual(expected)
  })

  it('should return the blog for any other page', () => {
    const value = 'https://blog.ghost.io/some-post/'
    const expected: GhostUrl = { kind: 'blog' }

    expect(parseGhostUrl(value)).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseGhostUrl('https://example.com/')).toBeUndefined()
  })
})

describe('ghostHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.ghost.io'],
      [false, 'https://blog.example.ghost.io'],
      [false, 'https://ghost.io'],
      [false, 'https://www.ghost.io'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(ghostHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(ghostHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Ghost', () => {
      expect(ghostHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://alice.ghost.io'
      const expected = [
        {
          uri: 'https://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and blog feeds for tag page', () => {
      const value = 'https://alice.ghost.io/tag/getting-started'
      const expected = [
        {
          uri: 'https://alice.ghost.io/tag/getting-started/rss/',
          hint: { key: 'ghost:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and blog feeds for tag page with a capitalized tag segment', () => {
      const value = 'https://alice.ghost.io/Tag/getting-started'
      const expected = [
        {
          uri: 'https://alice.ghost.io/tag/getting-started/rss/',
          hint: { key: 'ghost:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return author and blog feeds for author page', () => {
      const value = 'https://alice.ghost.io/author/ghost'
      const expected = [
        {
          uri: 'https://alice.ghost.io/author/ghost/rss/',
          hint: { key: 'ghost:author', label: 'Author' },
        },
        {
          uri: 'https://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return author and blog feeds for author page with a capitalized author segment', () => {
      const value = 'https://alice.ghost.io/Author/ghost'
      const expected = [
        {
          uri: 'https://alice.ghost.io/author/ghost/rss/',
          hint: { key: 'ghost:author', label: 'Author' },
        },
        {
          uri: 'https://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an http page', () => {
      const value = 'http://alice.ghost.io/tag/news/'
      const expected = [
        {
          uri: 'http://alice.ghost.io/tag/news/rss/',
          hint: { key: 'ghost:tag', label: 'Tag' },
        },
        {
          uri: 'http://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.ghost.io/some-article-slug'
      const expected = [
        {
          uri: 'https://alice.ghost.io/rss/',
          hint: { key: 'ghost:blog', label: 'Blog' },
        },
      ]

      expect(ghostHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the private key for a private site feed', () => {
      const value = 'https://alice.ghost.io/0123456789abcdef0123456789abcd/rss/'
      const expected: DiscoverUriHint = { key: 'ghost:private', label: 'Private feed' }

      expect(ghostHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the dispatcher', () => {
    it('should return an http collection feed without a trailing slash as itself', async () => {
      const value = 'http://alice.ghost.io/archive/rss'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.ghost.io/archive/rss',
          hint: { key: 'ghost:collection', label: 'Collection' },
        },
      ]
      const entries = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [ghostHandler],
        baseUrl: value,
      })

      expect(entries).toEqual(expected)
    })
  })
})
