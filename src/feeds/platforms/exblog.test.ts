import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { ExblogUrl } from './exblog.js'
import { exblogHandler, parseExblogUrl } from './exblog.js'

describe('parseExblogUrl', () => {
  it('should return the blog for a blog page', () => {
    const expected: ExblogUrl = { kind: 'blog', blog: 'example' }

    expect(parseExblogUrl('https://example.exblog.jp')).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: ExblogUrl = { kind: 'blog', blog: 'example' }

    expect(parseExblogUrl('https://example.exblog.jp/30123456/')).toEqual(expected)
  })

  it('should return the blog and category for a category page', () => {
    const expected: ExblogUrl = { kind: 'category', blog: 'example', category: '2' }

    expect(parseExblogUrl('https://example.exblog.jp/i2')).toEqual(expected)
  })

  it('should return the blog and category for a category page with a capitalized category segment', () => {
    const expected: ExblogUrl = { kind: 'category', blog: 'example', category: '2' }

    expect(parseExblogUrl('https://example.exblog.jp/I2')).toEqual(expected)
  })

  it('should return the category for a category page with a trailing slash', () => {
    const expected: ExblogUrl = { kind: 'category', blog: 'example', category: '2' }

    expect(parseExblogUrl('https://example.exblog.jp/i2/')).toEqual(expected)
  })

  it('should return the blog when the category id runs into letters', () => {
    const expected: ExblogUrl = { kind: 'blog', blog: 'example' }

    expect(parseExblogUrl('https://example.exblog.jp/i2x/')).toEqual(expected)
  })

  it('should return undefined for the portal', () => {
    expect(parseExblogUrl('https://www.exblog.jp/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseExblogUrl('https://exblog.jp/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseExblogUrl('https://blog.example.exblog.jp/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseExblogUrl('https://example.com/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseExblogUrl('not-a-url')).toBeUndefined()
  })
})

describe('exblogHandler', () => {
  describe('match', () => {
    it('should match Exblog URLs', () => {
      expect(exblogHandler.match('https://example.exblog.jp')).toBe(true)
    })

    it('should not match the portal', () => {
      expect(exblogHandler.match('https://www.exblog.jp/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return RSS and Atom feeds for blog', () => {
      const value = 'https://example.exblog.jp'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.exblog.jp/index.xml',
          hint: { key: 'exblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.exblog.jp/atom.xml',
          hint: { key: 'exblog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(exblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return category feeds for category page', () => {
      const value = 'https://example.exblog.jp/i2'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.exblog.jp/i2/index.xml',
          hint: { key: 'exblog:category', label: 'Category', format: 'rss' },
        },
        {
          uri: 'https://example.exblog.jp/i2/atom.xml',
          hint: { key: 'exblog:category', label: 'Category', format: 'atom' },
        },
        {
          uri: 'https://example.exblog.jp/index.xml',
          hint: { key: 'exblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.exblog.jp/atom.xml',
          hint: { key: 'exblog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(exblogHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the scheme of an HTTP blog page', () => {
      const value = 'http://example.exblog.jp/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.exblog.jp/index.xml',
          hint: { key: 'exblog:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://example.exblog.jp/atom.xml',
          hint: { key: 'exblog:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(exblogHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for the portal', () => {
      expect(exblogHandler.resolve('https://www.exblog.jp/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for an RSS feed', () => {
      const value = 'https://example.exblog.jp/index.xml'
      const expected: DiscoverUriHint = { key: 'exblog:posts', label: 'Posts', format: 'rss' }

      expect(exblogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an Atom feed', () => {
      const value = 'https://example.exblog.jp/atom.xml'
      const expected: DiscoverUriHint = { key: 'exblog:posts', label: 'Posts', format: 'atom' }

      expect(exblogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an RSS feed over HTTP', () => {
      const value = 'http://example.exblog.jp/index.xml'
      const expected: DiscoverUriHint = { key: 'exblog:posts', label: 'Posts', format: 'rss' }

      expect(exblogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category hint for an RSS category feed', () => {
      const value = 'https://example.exblog.jp/i12/index.xml'
      const expected: DiscoverUriHint = { key: 'exblog:category', label: 'Category', format: 'rss' }

      expect(exblogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category hint for an Atom category feed', () => {
      const value = 'https://example.exblog.jp/i12/atom.xml'
      const expected: DiscoverUriHint = {
        key: 'exblog:category',
        label: 'Category',
        format: 'atom',
      }

      expect(exblogHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a category feed whose id runs into letters', () => {
      const value = 'https://example.exblog.jp/i12x/index.xml'

      expect(exblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a category page', () => {
      const value = 'https://example.exblog.jp/i12/'

      expect(exblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a post page', () => {
      const value = 'https://example.exblog.jp/30123456/'

      expect(exblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the portal', () => {
      const value = 'https://www.exblog.jp/index.xml'

      expect(exblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.example.exblog.jp/index.xml'

      expect(exblogHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/index.xml'

      expect(exblogHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://example.exblog.jp/index.xml',
        { key: 'exblog:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://example.exblog.jp/atom.xml',
        { key: 'exblog:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'http://example.exblog.jp/index.xml',
        { key: 'exblog:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://example.exblog.jp/i12/index.xml',
        { key: 'exblog:category', label: 'Category', format: 'rss' },
      ],
      [
        'https://example.exblog.jp/i12/atom.xml',
        { key: 'exblog:category', label: 'Category', format: 'atom' },
      ],
      [
        'http://example.exblog.jp/i12/atom.xml',
        { key: 'exblog:category', label: 'Category', format: 'atom' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [exblogHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
