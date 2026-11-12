import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type ParsiblogUrl, parseParsiblogUrl, parsiblogHandler } from './parsiblog.js'

describe('parseParsiblogUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const expected: ParsiblogUrl = { kind: 'blog', blog: 'alice' }

    expect(parseParsiblogUrl('http://alice.parsiblog.com/')).toEqual(expected)
  })

  it('should return the blog for a parsiblog.ir subdomain', () => {
    const expected: ParsiblogUrl = { kind: 'blog', blog: 'alice' }

    expect(parseParsiblogUrl('http://alice.parsiblog.ir/')).toEqual(expected)
  })

  it('should return the blog for a post page in any case', () => {
    const value = 'http://Alice.ParsiBlog.com/Posts/12/%d8%b3%d9%84%d8%a7%d9%85/'
    const expected: ParsiblogUrl = { kind: 'blog', blog: 'alice' }

    expect(parseParsiblogUrl(value)).toEqual(expected)
  })

  it('should return undefined for the portal', () => {
    expect(parseParsiblogUrl('http://www.ParsiBlog.com/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseParsiblogUrl('http://parsiblog.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseParsiblogUrl('http://x.alice.parsiblog.com/')).toBeUndefined()
  })

  it('should return undefined for a nested parsiblog.ir subdomain', () => {
    expect(parseParsiblogUrl('http://x.alice.parsiblog.ir/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseParsiblogUrl('http://example.com/')).toBeUndefined()
  })
})

describe('parsiblogHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'http://alice.parsiblog.com/'],
      [false, 'http://www.parsiblog.com/'],
      [true, 'http://alice.parsiblog.ir/'],
      [false, 'http://www.parsiblog.ir/'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(parsiblogHandler.match(url)).toBe(expected)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Parsiblog', () => {
      expect(parsiblogHandler.resolve('http://example.com/')).toEqual([])
    })

    it('should return RSS and Atom feeds under the page scheme for a blog page', () => {
      const value = 'https://Alice.ParsiBlog.com/Posts/12/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.parsiblog.com/rss/',
          hint: { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.parsiblog.com/atom/',
          hint: { key: 'parsiblog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(parsiblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return the parsiblog.com feeds for a parsiblog.ir blog page', () => {
      const value = 'http://alice.parsiblog.ir/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.parsiblog.com/rss/',
          hint: { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://alice.parsiblog.com/atom/',
          hint: { key: 'parsiblog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(parsiblogHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    const feedHints: Array<[string, DiscoverUriHint]> = [
      [
        'http://alice.parsiblog.com/rss/',
        { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'http://alice.parsiblog.com/atom/',
        { key: 'parsiblog:posts', label: 'Posts', format: 'atom' },
      ],
      ['http://alice.parsiblog.com/rss', { key: 'parsiblog:posts', label: 'Posts', format: 'rss' }],
      ['http://alice.parsiblog.ir/rss', { key: 'parsiblog:posts', label: 'Posts', format: 'rss' }],
      [
        'http://alice.parsiblog.ir/atom',
        { key: 'parsiblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'http://www.alice.parsiblog.com/rss',
        { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'http://alice.parsiblog.com/RSS.aspx',
        { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'http://alice.parsiblog.com/rss.aspx',
        { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'http://alice.parsiblog.com/ATOM.aspx',
        { key: 'parsiblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'http://alice.parsiblog.com/Mag/RSS.aspx',
        { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'http://alice.parsiblog.com/Mag/RSS.aspx?SID=13',
        { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
      ],
    ]

    it.each(feedHints)('should return the posts hint for %s', (value, expected) => {
      expect(parsiblogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'http://alice.parsiblog.com/Posts/12/'

      expect(parsiblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a portal magazine feed', () => {
      const value = 'http://parsiblog.com/Mag/RSS.aspx?SID=13'

      expect(parsiblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the portal', () => {
      const value = 'http://www.parsiblog.com/rss/'

      expect(parsiblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'http://x.alice.parsiblog.com/rss/'

      expect(parsiblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'http://example.com/rss/'

      expect(parsiblogHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'http://alice.parsiblog.com/rss/',
        { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
      ],
      ['http://alice.parsiblog.com/rss', { key: 'parsiblog:posts', label: 'Posts', format: 'rss' }],
      [
        'http://alice.parsiblog.ir/atom',
        { key: 'parsiblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'http://www.alice.parsiblog.com/rss',
        { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'http://alice.parsiblog.com/RSS.aspx',
        { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'http://alice.parsiblog.com/ATOM.aspx',
        { key: 'parsiblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'http://alice.parsiblog.com/Mag/RSS.aspx',
        { key: 'parsiblog:posts', label: 'Posts', format: 'rss' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [parsiblogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
