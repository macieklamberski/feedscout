import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type GhostUrl, ghostHandler, parseGhostUrl } from './ghost.js'

describe('parseGhostUrl', () => {
  it('should return the tag for a tag page', () => {
    const expected: GhostUrl = { kind: 'tag', tag: 'news' }

    expect(parseGhostUrl('https://blog.ghost.io/tag/news/')).toEqual(expected)
  })

  it('should return the author for an author page', () => {
    const expected: GhostUrl = { kind: 'author', author: 'jane' }

    expect(parseGhostUrl('https://blog.ghost.io/author/jane/')).toEqual(expected)
  })

  it('should return the blog for any other page', () => {
    const expected: GhostUrl = { kind: 'blog' }

    expect(parseGhostUrl('https://blog.ghost.io/some-post/')).toEqual(expected)
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

    it('should return https feeds for an http page', () => {
      const value = 'http://alice.ghost.io/tag/news/'
      const expected = [
        {
          uri: 'https://alice.ghost.io/tag/news/rss/',
          hint: { key: 'ghost:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.ghost.io/rss/',
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

  describe('getFeedKey', () => {
    it('should return the blog key for a blog feed', () => {
      const value = 'https://alice.ghost.io/rss/'
      const expected = 'ghost:blog'

      expect(ghostHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for a blog feed without a trailing slash', () => {
      const value = 'https://alice.ghost.io/rss'
      const expected = 'ghost:blog'

      expect(ghostHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for a tag feed', () => {
      const value = 'https://alice.ghost.io/tag/getting-started/rss/'
      const expected = 'ghost:tag'

      expect(ghostHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the author key for an author feed', () => {
      const value = 'https://alice.ghost.io/author/jane/rss/'
      const expected = 'ghost:author'

      expect(ghostHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a tag page', () => {
      const value = 'https://alice.ghost.io/tag/getting-started/'

      expect(ghostHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a post page', () => {
      const value = 'https://alice.ghost.io/some-post/'

      expect(ghostHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.ghost.io/rss/'

      expect(ghostHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on another host', () => {
      const value = 'https://example.com/rss/'

      expect(ghostHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the dispatcher', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alice.ghost.io/rss/', { key: 'ghost:blog', label: 'Blog' }],
      ['https://alice.ghost.io/rss', { key: 'ghost:blog', label: 'Blog' }],
      ['http://alice.ghost.io/rss/', { key: 'ghost:blog', label: 'Blog' }],
      ['https://alice.ghost.io/tag/getting-started/rss/', { key: 'ghost:tag', label: 'Tag' }],
      ['https://alice.ghost.io/author/jane/rss/', { key: 'ghost:author', label: 'Author' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [ghostHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
