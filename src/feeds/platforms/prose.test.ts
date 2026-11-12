import { describe, expect, it } from 'bun:test'
import type { DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type ProseUrl, parseProseUrl, proseHandler } from './prose.js'

describe('parseProseUrl', () => {
  it('should return the home page for the apex host', () => {
    const expected: ProseUrl = { kind: 'home' }

    expect(parseProseUrl('https://prose.sh/')).toEqual(expected)
  })

  it('should return the tag for a tag query', () => {
    const expected: ProseUrl = {
      kind: 'tag',
      username: 'example',
      tag: 'go',
    }

    expect(parseProseUrl('https://example.prose.sh/?tag=go')).toEqual(expected)
  })

  it('should return the blog for a subdomain', () => {
    const expected: ProseUrl = {
      kind: 'blog',
      username: 'example',
    }

    expect(parseProseUrl('https://example.prose.sh/')).toEqual(expected)
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseProseUrl('https://blog.example.prose.sh/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseProseUrl('https://example.com/')).toBeUndefined()
  })
})

describe('proseHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.prose.sh'],
      [false, 'https://blog.example.prose.sh'],
      [true, 'https://prose.sh'],
      [true, 'https://www.prose.sh'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(proseHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(proseHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside prose.sh', () => {
      expect(proseHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://alice.prose.sh'
      const expected = [
        {
          uri: 'https://alice.prose.sh/rss',
          hint: { key: 'prose:blog', label: 'Blog' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.prose.sh/some-article-slug'
      const expected = [
        {
          uri: 'https://alice.prose.sh/rss',
          hint: { key: 'prose:blog', label: 'Blog' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag-filtered feed when tag query is set', () => {
      const value = 'https://alice.prose.sh/?tag=announcement'
      const expected = [
        {
          uri: 'https://alice.prose.sh/rss?tag=announcement',
          hint: { key: 'prose:tag', label: 'Tag' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return https feed URL for an http blog page', () => {
      const value = 'http://alice.prose.sh/'
      const expected = [
        {
          uri: 'https://alice.prose.sh/rss',
          hint: { key: 'prose:blog', label: 'Blog' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return discovery feed for apex prose.sh', () => {
      const value = 'https://prose.sh/'
      const expected = [
        {
          uri: 'https://prose.sh/rss',
          hint: { key: 'prose:discovery', label: 'Discovery' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })

    it('should return discovery feed for www apex', () => {
      const value = 'https://www.prose.sh/'
      const expected = [
        {
          uri: 'https://prose.sh/rss',
          hint: { key: 'prose:discovery', label: 'Discovery' },
        },
      ]

      expect(proseHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the blog hint for a blog feed', () => {
      const value = 'https://alice.prose.sh/rss'
      const expected: DiscoverUriHint = { key: 'prose:blog', label: 'Blog' }

      expect(proseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for a blog atom feed', () => {
      const value = 'https://alice.prose.sh/atom'
      const expected: DiscoverUriHint = { key: 'prose:blog', label: 'Blog' }

      expect(proseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed', () => {
      const value = 'https://alice.prose.sh/rss?tag=go'
      const expected: DiscoverUriHint = { key: 'prose:tag', label: 'Tag' }

      expect(proseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag atom feed', () => {
      const value = 'https://alice.prose.sh/atom?tag=go'
      const expected: DiscoverUriHint = { key: 'prose:tag', label: 'Tag' }

      expect(proseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for a blog rss.xml feed', () => {
      const value = 'https://alice.prose.sh/rss.xml'
      const expected: DiscoverUriHint = { key: 'prose:blog', label: 'Blog' }

      expect(proseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag rss.xml feed', () => {
      const value = 'https://alice.prose.sh/rss.xml?tag=go'
      const expected: DiscoverUriHint = { key: 'prose:tag', label: 'Tag' }

      expect(proseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for a blog feed.xml feed', () => {
      const value = 'https://alice.prose.sh/feed.xml'
      const expected: DiscoverUriHint = { key: 'prose:blog', label: 'Blog' }

      expect(proseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed.xml feed', () => {
      const value = 'https://alice.prose.sh/feed.xml?tag=go'
      const expected: DiscoverUriHint = { key: 'prose:tag', label: 'Tag' }

      expect(proseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the blog hint for a blog atom.xml feed', () => {
      const value = 'https://alice.prose.sh/atom.xml'
      const expected: DiscoverUriHint = { key: 'prose:blog', label: 'Blog' }

      expect(proseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag atom.xml feed', () => {
      const value = 'https://alice.prose.sh/atom.xml?tag=go'
      const expected: DiscoverUriHint = { key: 'prose:tag', label: 'Tag' }

      expect(proseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the discovery hint for the discovery feed', () => {
      const value = 'https://prose.sh/rss'
      const expected: DiscoverUriHint = { key: 'prose:discovery', label: 'Discovery' }

      expect(proseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the discovery hint for the discovery atom feed', () => {
      const value = 'https://prose.sh/rss.atom'
      const expected: DiscoverUriHint = { key: 'prose:discovery', label: 'Discovery' }

      expect(proseHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog post page', () => {
      const value = 'https://alice.prose.sh/some-article-slug'

      expect(proseHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.alice.prose.sh/rss'

      expect(proseHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })
})

describe('discoverUrisFromPlatform', () => {
  const values: Array<[string, { key: string; label: string }]> = [
    ['https://alice.prose.sh/atom', { key: 'prose:blog', label: 'Blog' }],
    ['https://alice.prose.sh/rss/?tag=go', { key: 'prose:tag', label: 'Tag' }],
    ['https://alice.prose.sh/atom?tag=go', { key: 'prose:tag', label: 'Tag' }],
    ['https://alice.prose.sh/rss.xml', { key: 'prose:blog', label: 'Blog' }],
    ['https://alice.prose.sh/rss.xml?tag=go', { key: 'prose:tag', label: 'Tag' }],
    ['https://alice.prose.sh/feed.xml', { key: 'prose:blog', label: 'Blog' }],
    ['https://alice.prose.sh/feed.xml?tag=go', { key: 'prose:tag', label: 'Tag' }],
    ['https://alice.prose.sh/atom.xml', { key: 'prose:blog', label: 'Blog' }],
    ['https://alice.prose.sh/atom.xml?tag=go', { key: 'prose:tag', label: 'Tag' }],
    ['https://prose.sh/rss.atom', { key: 'prose:discovery', label: 'Discovery' }],
  ]

  it.each(values)('should return %s as the feed it is', async (value, hint) => {
    const options = {
      ...defaultPlatformOptions,
      handlers: [proseHandler],
      baseUrl: value,
    }
    const expected = [{ uri: value, hint }]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })
})
