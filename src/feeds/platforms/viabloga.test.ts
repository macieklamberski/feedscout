import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseViablogaUrl, type ViablogaUrl, viablogaHandler } from './viabloga.js'

describe('parseViablogaUrl', () => {
  it('should return the blog for a blog home page', () => {
    const expected: ViablogaUrl = { kind: 'blog' }

    expect(parseViablogaUrl('http://alice.viabloga.com/')).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: ViablogaUrl = { kind: 'blog' }

    expect(parseViablogaUrl('http://alice.viabloga.com/news/canal-du-midi')).toEqual(expected)
  })

  it('should return the category for a category page', () => {
    const value = 'http://alice.viabloga.com/cinema.shtml'
    const expected: ViablogaUrl = { kind: 'category', category: 'cinema' }

    expect(parseViablogaUrl(value)).toEqual(expected)
  })

  const otherUrls = [
    'http://www.viabloga.com/',
    'http://www.alice.viabloga.com/',
    'http://viabloga.com/',
    'http://example.com/',
  ]

  it.each(otherUrls)('should return undefined for %s', (url) => {
    expect(parseViablogaUrl(url)).toBeUndefined()
  })
})

describe('viablogaHandler', () => {
  describe('match', () => {
    it('should match a blog URL', () => {
      expect(viablogaHandler.match('http://alice.viabloga.com/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(viablogaHandler.match('http://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts, comments and wiki feeds for blog', () => {
      const value = 'http://alice.viabloga.com/news/canal-du-midi'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.viabloga.com/index.xml',
          hint: { key: 'viabloga:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://alice.viabloga.com/atom.xml',
          hint: { key: 'viabloga:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://alice.viabloga.com/index.rdf',
          hint: { key: 'viabloga:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'http://alice.viabloga.com/comments.xml',
          hint: { key: 'viabloga:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: 'http://alice.viabloga.com/wiki.rdf',
          hint: { key: 'viabloga:wiki', label: 'Wiki', format: 'rdf' },
        },
      ]

      expect(viablogaHandler.resolve(value)).toEqual(expected)
    })

    it('should return the category feed and the blog feeds for a category page', () => {
      const value = 'http://alice.viabloga.com/cinema.shtml'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.viabloga.com/cinema.xml',
          hint: { key: 'viabloga:category', label: 'Category', format: 'rss' },
        },
        {
          uri: 'http://alice.viabloga.com/index.xml',
          hint: { key: 'viabloga:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://alice.viabloga.com/atom.xml',
          hint: { key: 'viabloga:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://alice.viabloga.com/index.rdf',
          hint: { key: 'viabloga:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'http://alice.viabloga.com/comments.xml',
          hint: { key: 'viabloga:comments', label: 'Comments', format: 'rss' },
        },
        {
          uri: 'http://alice.viabloga.com/wiki.rdf',
          hint: { key: 'viabloga:wiki', label: 'Wiki', format: 'rdf' },
        },
      ]

      expect(viablogaHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside Viabloga', () => {
      expect(viablogaHandler.resolve('http://example.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    const feedHints: Array<[string, DiscoverUriHint]> = [
      [
        'http://alice.viabloga.com/index.xml',
        { key: 'viabloga:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'http://alice.viabloga.com/atom.xml',
        { key: 'viabloga:posts', label: 'Posts', format: 'atom' },
      ],
      ['http://alice.viabloga.com/atom', { key: 'viabloga:posts', label: 'Posts', format: 'atom' }],
      [
        'http://alice.viabloga.com/index.rdf',
        { key: 'viabloga:posts', label: 'Posts', format: 'rdf' },
      ],
    ]

    it.each(feedHints)('should return the posts key for %s', (value, expected) => {
      expect(viablogaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the comments key for a comments feed', () => {
      const value = 'http://alice.viabloga.com/comments.xml'
      const expected: DiscoverUriHint = {
        key: 'viabloga:comments',
        label: 'Comments',
        format: 'rss',
      }

      expect(viablogaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the wiki key for a wiki feed', () => {
      const value = 'http://alice.viabloga.com/wiki.rdf'
      const expected: DiscoverUriHint = { key: 'viabloga:wiki', label: 'Wiki', format: 'rdf' }

      expect(viablogaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the wiki key for a wiki feed over https', () => {
      const value = 'https://alice.viabloga.com/wiki.rdf'
      const expected: DiscoverUriHint = { key: 'viabloga:wiki', label: 'Wiki', format: 'rdf' }

      expect(viablogaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category key for a category feed', () => {
      const value = 'http://alice.viabloga.com/cinema.xml'
      const expected: DiscoverUriHint = {
        key: 'viabloga:category',
        label: 'Category',
        format: 'rss',
      }

      expect(viablogaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category key for a full text category feed', () => {
      const value = 'http://alice.viabloga.com/cinema_full.xml'
      const expected: DiscoverUriHint = {
        key: 'viabloga:category',
        label: 'Category',
        format: 'rss',
      }

      expect(viablogaHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a post page', () => {
      const value = 'http://alice.viabloga.com/news/canal-du-midi'

      expect(viablogaHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a theme feed the handler does not build', () => {
      const value = 'https://alice.viabloga.com/rss/theme/example.xml'

      expect(viablogaHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'http://viabloga.com/index.xml'

      expect(viablogaHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the www host', () => {
      const value = 'http://www.viabloga.com/index.xml'

      expect(viablogaHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'http://blog.alice.viabloga.com/index.xml'

      expect(viablogaHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'http://example.com/index.xml'

      expect(viablogaHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'http://alice.viabloga.com/index.xml',
        { key: 'viabloga:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'http://alice.viabloga.com/atom.xml',
        { key: 'viabloga:posts', label: 'Posts', format: 'atom' },
      ],
      ['http://alice.viabloga.com/atom', { key: 'viabloga:posts', label: 'Posts', format: 'atom' }],
      [
        'http://alice.viabloga.com/index.rdf',
        { key: 'viabloga:posts', label: 'Posts', format: 'rdf' },
      ],
      [
        'http://alice.viabloga.com/comments.xml',
        { key: 'viabloga:comments', label: 'Comments', format: 'rss' },
      ],
      [
        'http://alice.viabloga.com/wiki.rdf',
        { key: 'viabloga:wiki', label: 'Wiki', format: 'rdf' },
      ],
      [
        'https://alice.viabloga.com/wiki.rdf',
        { key: 'viabloga:wiki', label: 'Wiki', format: 'rdf' },
      ],
      [
        'https://alice.viabloga.com/cinema_full.xml',
        { key: 'viabloga:category', label: 'Category', format: 'rss' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [viablogaHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
