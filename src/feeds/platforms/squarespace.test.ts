import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  isSquarespaceHeaders,
  parseSquarespaceUrl,
  type SquarespaceUrl,
  squarespaceHandler,
} from './squarespace.js'

const squarespaceHeaders = new Headers({ server: 'Squarespace' })

describe('isSquarespaceHeaders', () => {
  it('should return true for the Squarespace server header', () => {
    expect(isSquarespaceHeaders(squarespaceHeaders)).toBe(true)
  })

  it('should return true case-insensitively', () => {
    expect(isSquarespaceHeaders(new Headers({ server: 'squarespace' }))).toBe(true)
  })

  it('should return false when the header is absent', () => {
    expect(isSquarespaceHeaders(new Headers())).toBe(false)
    expect(isSquarespaceHeaders(new Headers({ server: 'nginx' }))).toBe(false)
  })
})

describe('parseSquarespaceUrl', () => {
  it('should return the collection for a collection page', () => {
    const expected: SquarespaceUrl = { kind: 'collection', collection: 'blog' }

    expect(parseSquarespaceUrl('https://site.example/blog')).toEqual(expected)
  })

  it('should return the collection for a post page', () => {
    const expected: SquarespaceUrl = { kind: 'collection', collection: 'blog' }

    expect(parseSquarespaceUrl('https://site.example/blog/first-post')).toEqual(expected)
  })

  it('should return the category of a category page', () => {
    const value = 'https://site.example/blog/category/News'
    const expected: SquarespaceUrl = { kind: 'category', collection: 'blog', category: 'News' }

    expect(parseSquarespaceUrl(value)).toEqual(expected)
  })

  it('should return the category of a collection page filtered by query', () => {
    const value = 'https://site.example/blog?category=Bible+Talks'
    const expected: SquarespaceUrl = {
      kind: 'category',
      collection: 'blog',
      category: 'Bible Talks',
    }

    expect(parseSquarespaceUrl(value)).toEqual(expected)
  })

  it('should return the category of a category page with a plus in the name', () => {
    const value = 'https://site.example/blog/category/Example+Talks'
    const expected: SquarespaceUrl = {
      kind: 'category',
      collection: 'blog',
      category: 'Example Talks',
    }

    expect(parseSquarespaceUrl(value)).toEqual(expected)
  })

  it('should return the tag of a tag page', () => {
    const value = 'https://site.example/blog/tag/podcast'
    const expected: SquarespaceUrl = { kind: 'tag', collection: 'blog', tag: 'podcast' }

    expect(parseSquarespaceUrl(value)).toEqual(expected)
  })

  it('should return the tag of a collection page filtered by query', () => {
    const value = 'https://site.example/blog?tag=podcast'
    const expected: SquarespaceUrl = { kind: 'tag', collection: 'blog', tag: 'podcast' }

    expect(parseSquarespaceUrl(value)).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseSquarespaceUrl('https://site.example/')).toBeUndefined()
  })
})

describe('squarespaceHandler', () => {
  describe('match', () => {
    it('should match a collection path', () => {
      const value = 'https://example.com/blog'

      expect(squarespaceHandler.match(value, '', squarespaceHeaders)).toBe(true)
    })

    it('should match a collection path under any slug', () => {
      const value = 'https://example.com/journal/a-post'

      expect(squarespaceHandler.match(value, '', squarespaceHeaders)).toBe(true)
    })

    it('should not match the site root', () => {
      expect(squarespaceHandler.match('https://example.com/', '', squarespaceHeaders)).toBe(false)
    })

    it('should not match without the header', () => {
      expect(squarespaceHandler.match('https://example.com/blog')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(squarespaceHandler.match('not-a-url', '', squarespaceHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for the root', () => {
      expect(squarespaceHandler.resolve('https://site.example/')).toEqual([])
    })

    it('should return the collection feed', () => {
      const value = 'https://example.com/blog'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection', format: 'rss' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should use the first path segment of a deeper page', () => {
      const value = 'https://example.com/news/a-post'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/news?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection', format: 'rss' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the site root', () => {
      expect(squarespaceHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the collection feed of a site on squarespace.com', () => {
      const value = 'https://alice.squarespace.com/blog/a-post'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.squarespace.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection', format: 'rss' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of a site on squarespace.com', () => {
      const value = 'http://alice.squarespace.com/blog'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.squarespace.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection', format: 'rss' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })
    it('should return the category and collection feeds for a category page', () => {
      const value = 'https://example.com/blog/category/News'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/blog?category=News&format=rss',
          hint: { key: 'squarespace:category', label: 'Category', format: 'rss' },
        },
        {
          uri: 'https://example.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection', format: 'rss' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should decode an encoded category of a category page', () => {
      const value = 'https://alice.squarespace.com/blog/category/Example%20Talks'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.squarespace.com/blog?category=Example%20Talks&format=rss',
          hint: { key: 'squarespace:category', label: 'Category', format: 'rss' },
        },
        {
          uri: 'https://alice.squarespace.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection', format: 'rss' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag and collection feeds for a tag page', () => {
      const value = 'https://alice.squarespace.com/blog?tag=podcast'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.squarespace.com/blog?format=rss&tag=podcast',
          hint: { key: 'squarespace:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.squarespace.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection', format: 'rss' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the collection hint for a Squarespace 5 feed with a session id', () => {
      const value = 'http://alice.squarespace.com/blog/rss.xml;jsessionid=ABC123.v5-web001'
      const expected: DiscoverUriHint = {
        key: 'squarespace:collection',
        label: 'Collection',
        format: 'rss',
      }

      expect(squarespaceHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a category feed by path as itself', async () => {
      const value = 'https://alice.squarespace.com/blog/category/News?format=rss'
      const options = {
        ...defaultPlatformOptions,
        handlers: [squarespaceHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: value,
          hint: { key: 'squarespace:category', label: 'Category', format: 'rss' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
