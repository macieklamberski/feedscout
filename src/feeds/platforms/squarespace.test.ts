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
      const expected = [
        {
          uri: 'https://example.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should use the first path segment of a deeper page', () => {
      const value = 'https://example.com/news/a-post'
      const expected = [
        {
          uri: 'https://example.com/news?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection' },
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
          hint: { key: 'squarespace:collection', label: 'Collection' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of a site on squarespace.com', () => {
      const value = 'http://alice.squarespace.com/blog'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.squarespace.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })
    it('should return the category and collection feeds for a category page', () => {
      const value = 'https://example.com/blog/category/News'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/blog?category=News&format=rss',
          hint: { key: 'squarespace:category', label: 'Category' },
        },
        {
          uri: 'https://example.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag and collection feeds for a tag page', () => {
      const value = 'https://alice.squarespace.com/blog?tag=podcast'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.squarespace.com/blog?tag=podcast&format=rss',
          hint: { key: 'squarespace:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.squarespace.com/blog?format=rss',
          hint: { key: 'squarespace:collection', label: 'Collection' },
        },
      ]

      expect(squarespaceHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    const collection: DiscoverUriHint = { key: 'squarespace:collection', label: 'Collection' }
    const category: DiscoverUriHint = { key: 'squarespace:category', label: 'Category' }
    const tag: DiscoverUriHint = { key: 'squarespace:tag', label: 'Tag' }
    const comments: DiscoverUriHint = { key: 'squarespace:comments', label: 'Comments' }
    const atom: DiscoverUriHint = { ...collection, format: 'atom' }
    const rdf: DiscoverUriHint = { ...collection, format: 'rdf' }
    const otherShapes: Array<[string, DiscoverUriHint]> = [
      ['https://alice.squarespace.com/?format=rss', collection],
      ['https://alice.squarespace.com/en/blog?format=rss', collection],
      [
        'https://alice.squarespace.com/blog?format=sqsp_rss_wceoq1kgqnmf2cn9czutlluofr44tazt',
        collection,
      ],
      [
        'https://alice.squarespace.com/?format=sqsp_rss_wceoq1kgqnmf2cn9czutlluofr44tazt',
        collection,
      ],
      ['http://alice.squarespace.com/blog/rss.xml', collection],
      ['http://alice.squarespace.com/blog/rss.xml;jsessionid=ABC123.v5-web001', collection],
      ['http://alice.squarespace.com/blog/atom.xml', atom],
      ['http://alice.squarespace.com/blog/atom.xml;jsessionid=ABC123.v5-web001', atom],
      ['http://alice.squarespace.com/blog/rdf.xml', rdf],
      ['http://alice.squarespace.com/blog/rdf.xml;jsessionid=ABC123.v5-web001', rdf],
      ['https://alice.squarespace.com/blog/category/News?format=rss', category],
      ['http://alice.squarespace.com/blog/rss.xml?categoryId=12345', category],
      [
        'http://alice.squarespace.com/blog/rss.xml;jsessionid=ABC123.v5-web001?categoryId=12345',
        category,
      ],
      [
        'http://alice.squarespace.com/blog/atom.xml?categoryId=12345',
        { ...category, format: 'atom' },
      ],
      ['https://alice.squarespace.com/?category=Podcast&format=rss', category],
      ['https://alice.squarespace.com/?format=rss&tag=podcast', tag],
      ['https://alice.squarespace.com/blog/tag/podcast?format=rss', tag],
      ['http://alice.squarespace.com/blog/rss-comments.xml', comments],
      ['http://alice.squarespace.com/blog/rss-comments.xml;jsessionid=ABC123.v5-web001', comments],
    ]

    it.each(otherShapes)('should return the hint of %s', (value, expected) => {
      expect(squarespaceHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it.each(otherShapes)('should return undefined for %s on a custom domain', (feedUrl) => {
      const value = feedUrl.replace('alice.squarespace.com', 'example.com')

      expect(squarespaceHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the collection hint for a collection feed on squarespace.com', () => {
      const value = 'https://alice.squarespace.com/blog?format=rss'
      const expected: DiscoverUriHint = { key: 'squarespace:collection', label: 'Collection' }

      expect(squarespaceHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the collection hint for an http collection feed', () => {
      const value = 'http://alice.squarespace.com/podcast?format=rss'
      const expected: DiscoverUriHint = { key: 'squarespace:collection', label: 'Collection' }

      expect(squarespaceHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the collection hint for a feed with a trailing slash', () => {
      const value = 'https://alice.squarespace.com/blog/?format=rss'
      const expected: DiscoverUriHint = { key: 'squarespace:collection', label: 'Collection' }

      expect(squarespaceHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category hint for a category feed', () => {
      const value = 'https://alice.squarespace.com/blog?category=News&format=rss'
      const expected: DiscoverUriHint = { key: 'squarespace:category', label: 'Category' }

      expect(squarespaceHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category hint for a category feed with a plus in the name', () => {
      const value = 'https://alice.squarespace.com/resources?category=Bible+Talks&format=rss'
      const expected: DiscoverUriHint = { key: 'squarespace:category', label: 'Category' }

      expect(squarespaceHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed', () => {
      const value = 'https://alice.squarespace.com/podcast?format=rss&tag=example'
      const expected: DiscoverUriHint = { key: 'squarespace:tag', label: 'Tag' }

      expect(squarespaceHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a collection page', () => {
      const value = 'https://alice.squarespace.com/blog'

      expect(squarespaceHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the www host', () => {
      const value = 'https://www.squarespace.com/blog?format=rss'

      expect(squarespaceHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another sqsp_rss format value', () => {
      const value = 'https://alice.squarespace.com/blog?format=sqsp_rss_abc123'

      expect(squarespaceHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://squarespace.com/blog?format=rss'

      expect(squarespaceHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.alice.squarespace.com/news?format=rss'

      expect(squarespaceHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://example.com/blog?format=rss'

      expect(squarespaceHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const collection: DiscoverUriHint = { key: 'squarespace:collection', label: 'Collection' }
    const category: DiscoverUriHint = { key: 'squarespace:category', label: 'Category' }
    const tag: DiscoverUriHint = { key: 'squarespace:tag', label: 'Tag' }
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://alice.squarespace.com/blog?format=rss', collection],
      ['http://alice.squarespace.com/podcast?format=rss', collection],
      ['https://alice.squarespace.com/blog/?category=News&format=rss', category],
      ['http://alice.squarespace.com/blog?category=Example+Talks&format=rss', category],
      ['https://alice.squarespace.com/podcast?format=rss&tag=example', tag],
      ['http://alice.squarespace.com/blog/?tag=example&format=rss', tag],
      ['https://alice.squarespace.com/?format=rss', collection],
      ['https://alice.squarespace.com/en/blog?format=rss', collection],
      [
        'https://alice.squarespace.com/blog?format=sqsp_rss_wceoq1kgqnmf2cn9czutlluofr44tazt',
        collection,
      ],
      ['http://alice.squarespace.com/blog/rss.xml;jsessionid=ABC123.v5-web001', collection],
      ['http://alice.squarespace.com/blog/atom.xml', { ...collection, format: 'atom' }],
      ['http://alice.squarespace.com/blog/rdf.xml', { ...collection, format: 'rdf' }],
      ['https://alice.squarespace.com/blog/category/News?format=rss', category],
      ['http://alice.squarespace.com/blog/rss.xml?categoryId=12345', category],
      ['https://alice.squarespace.com/blog/tag/podcast?format=rss', tag],
      [
        'http://alice.squarespace.com/blog/rss-comments.xml',
        { key: 'squarespace:comments', label: 'Comments' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [squarespaceHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
