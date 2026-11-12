import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { cocologHandler } from './cocolog.js'

const homeContent = `
  <link
    rel="EditURI"
    type="application/rsd+xml"
    href="https://app.cocolog-nifty.com/t/rsd/47230"
  />
  <link
    rel="alternate"
    media="handheld"
    href="http://app.m-cocolog.jp/t/typecast/47230/46630"
  />
  <link
    rel="alternate"
    type="application/atom+xml"
    title="Atom"
    href="http://example.cocolog-nifty.com/index/atom.xml"
  />
  <link
    rel="alternate"
    type="application/rss+xml"
    title="RSS"
    href="http://example.cocolog-nifty.com/index/index.rdf"
  />
`

describe('cocologHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.cocolog-nifty.com/blog/'],
      [true, 'https://example.cocolog-nifty.com/blog/2024/01/post-1a2b.html'],
      [true, 'http://example.air-nifty.com/consulting/cat12345/index.html'],
      [true, 'http://example.way-nifty.com/diary/'],
      [false, 'https://example.cocolog-nifty.com/'],
      [false, 'https://example.cocolog-nifty.com/.shared/js/ax.js'],
      [false, 'https://example.cocolog-nifty.com/about.html'],
      [false, 'https://www.cocolog-nifty.com/blog/'],
      [false, 'https://app.f.cocolog-nifty.com/t/rsd/335263'],
      [false, 'https://cocolog-nifty.com/blog/'],
      [false, 'https://example.com/blog/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(cocologHandler.match(url)).toBe(expected)
    })

    it('should return true for the home page linking its blog feeds', () => {
      expect(cocologHandler.match('https://example.cocolog-nifty.com/', homeContent)).toBe(true)
    })

    it('should return false for the home page linking feeds on another host', () => {
      const value = `
        <link
          rel="alternate"
          type="application/rss+xml"
          href="http://other.cocolog-nifty.com/blog/index.rdf"
        />
      `

      expect(cocologHandler.match('https://example.cocolog-nifty.com/', value)).toBe(false)
    })

    it('should return false for the home page linking a feed without an href', () => {
      const value = `
        <link
          rel="alternate"
          type="application/rss+xml"
        />
      `

      expect(cocologHandler.match('https://example.cocolog-nifty.com/', value)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the posts feeds of the blog in the URL', () => {
      const value = 'https://example.cocolog-nifty.com/consulting/2024/01/post-1a2b.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.cocolog-nifty.com/consulting/atom.xml',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.cocolog-nifty.com/consulting/index.rdf',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://example.cocolog-nifty.com/consulting/rss.xml',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(cocologHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of the page', () => {
      const value = 'http://example.cocolog-nifty.com/consulting/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.cocolog-nifty.com/consulting/atom.xml',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'http://example.cocolog-nifty.com/consulting/index.rdf',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'http://example.cocolog-nifty.com/consulting/rss.xml',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(cocologHandler.resolve(value)).toEqual(expected)
    })

    it('should return the posts feeds of the blog the home page links', () => {
      const value = 'https://example.cocolog-nifty.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.cocolog-nifty.com/index/atom.xml',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.cocolog-nifty.com/index/index.rdf',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'rdf' },
        },
        {
          uri: 'https://example.cocolog-nifty.com/index/rss.xml',
          hint: { key: 'cocolog:posts', label: 'Posts', format: 'rss' },
        },
      ]

      expect(cocologHandler.resolve(value, homeContent)).toEqual(expected)
    })

    it('should return empty array for the home page without feed links', () => {
      expect(cocologHandler.resolve('https://example.cocolog-nifty.com/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for an Atom feed', () => {
      const value = 'https://example.cocolog-nifty.com/blog/atom.xml'
      const expected: DiscoverUriHint = { key: 'cocolog:posts', label: 'Posts', format: 'atom' }

      expect(cocologHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an RDF feed', () => {
      const value = 'https://example.cocolog-nifty.com/blog/index.rdf'
      const expected: DiscoverUriHint = { key: 'cocolog:posts', label: 'Posts', format: 'rdf' }

      expect(cocologHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an RSS feed', () => {
      const value = 'https://example.cocolog-nifty.com/blog/rss.xml'
      const expected: DiscoverUriHint = { key: 'cocolog:posts', label: 'Posts', format: 'rss' }

      expect(cocologHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an http feed on another domain', () => {
      const value = 'http://alice.moe-nifty.com/diary/index.rdf'
      const expected: DiscoverUriHint = { key: 'cocolog:posts', label: 'Posts', format: 'rdf' }

      expect(cocologHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a post page', () => {
      const value = 'https://example.cocolog-nifty.com/blog/2024/01/post-1a2b.html'

      expect(cocologHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path under a dotted first segment', () => {
      const value = 'https://example.cocolog-nifty.com/.shared/atom.xml'

      expect(cocologHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a service host', () => {
      const value = 'https://app.f.cocolog-nifty.com/t/atom.xml'

      expect(cocologHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the apex', () => {
      const value = 'https://cocolog-nifty.com/blog/atom.xml'

      expect(cocologHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/blog/atom.xml'

      expect(cocologHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://example.cocolog-nifty.com/blog/atom.xml',
        { key: 'cocolog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'http://example.cocolog-nifty.com/blog/index.rdf',
        { key: 'cocolog:posts', label: 'Posts', format: 'rdf' },
      ],
      [
        'https://alice.moe-nifty.com/diary/rss.xml',
        { key: 'cocolog:posts', label: 'Posts', format: 'rss' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [cocologHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
