import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseWeeblyUrl, type WeeblyUrl, weeblyHandler } from './weebly.js'

describe('parseWeeblyUrl', () => {
  it('should return the page without its html suffix', () => {
    const expected: WeeblyUrl = { kind: 'blog', page: 'about' }

    expect(parseWeeblyUrl('https://mysite.weebly.com/about.html')).toEqual(expected)
  })

  it('should return the page without any other format extension', () => {
    const expected: WeeblyUrl = { kind: 'blog', page: 'about' }

    expect(parseWeeblyUrl('https://mysite.weebly.com/about.php')).toEqual(expected)
  })

  it('should return the blog with its page for a custom blog page', () => {
    const expected: WeeblyUrl = { kind: 'blog', page: 'articles' }

    expect(parseWeeblyUrl('https://example.weebly.com/articles')).toEqual(expected)
  })

  it('should return the blog for the blog page', () => {
    const expected: WeeblyUrl = { kind: 'blog' }

    expect(parseWeeblyUrl('https://example.weebly.com/blog')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: WeeblyUrl = { kind: 'home' }

    expect(parseWeeblyUrl('https://example.weebly.com/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseWeeblyUrl('https://example.com/')).toBeUndefined()
  })
})

describe('weeblyHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.weebly.com'],
      [false, 'https://blog.example.weebly.com'],
      [false, 'https://weebly.com'],
      [false, 'https://www.weebly.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(weeblyHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(weeblyHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Weebly', () => {
      expect(weeblyHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return default feed for blog root', () => {
      const value = 'https://example.weebly.com'
      const expected = [
        {
          uri: 'https://example.weebly.com/blog/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feed of every page the root links beside the default feed', () => {
      const value = 'https://example.weebly.com/'
      const content = `
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/newsletter.html">Newsletter</a></li>
          <li><a href="/blog.html">Blog</a></li>
          <li><a href="https://example.weebly.com/sermons">Sermons</a></li>
          <li><a href="/newsletter.html">Newsletter</a></li>
        </ul>
      `
      const expected = [
        {
          uri: 'https://example.weebly.com/blog/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
        {
          uri: 'https://example.weebly.com/newsletter/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
        {
          uri: 'https://example.weebly.com/sermons/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should skip a link to another host on the root', () => {
      const value = 'https://example.weebly.com/'
      const content = '<a href="https://example.com/newsletter.html">Newsletter</a>'
      const expected = [
        {
          uri: 'https://example.weebly.com/blog/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should fold a capitalised blog link onto the default feed', () => {
      const value = 'https://example.weebly.com/'
      const content = '<a href="/Blog.html">Blog</a>'
      const expected = [
        {
          uri: 'https://example.weebly.com/blog/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should skip a link to a file on the root', () => {
      const value = 'https://example.weebly.com/'
      const content = '<a href="/favicon.ico">Icon</a>'
      const expected = [
        {
          uri: 'https://example.weebly.com/blog/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should skip a link to a nested path on the root', () => {
      const value = 'https://example.weebly.com/'
      const content = '<a href="/blog/archives/10-2025">October 2025</a>'
      const expected = [
        {
          uri: 'https://example.weebly.com/blog/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return only the custom slug feed for named blog page', () => {
      const value = 'https://example.weebly.com/articles'
      const expected = [
        {
          uri: 'https://example.weebly.com/articles/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog id feed for a numeric segment', () => {
      const value = 'https://example.weebly.com/1/feed'
      const expected = [
        {
          uri: 'https://example.weebly.com/1/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value)).toEqual(expected)
    })

    it('should return default feed once for blog page', () => {
      const value = 'https://example.weebly.com/blog'
      const expected = [
        {
          uri: 'https://example.weebly.com/blog/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value)).toEqual(expected)
    })

    it('should return default feed once for blog page with a capitalized blog segment', () => {
      const value = 'https://example.weebly.com/Blog'
      const expected = [
        {
          uri: 'https://example.weebly.com/blog/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of the page', () => {
      const value = 'http://aeheideman.weebly.com/5'
      const expected = [
        {
          uri: 'http://aeheideman.weebly.com/5/feed',
          hint: { key: 'weebly:blog', label: 'Blog' },
        },
      ]

      expect(weeblyHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the blog key for a blog id feed', () => {
      const value = 'https://bmsavid.weebly.com/1/feed'
      const expected = 'weebly:blog'

      expect(weeblyHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for a blog id feed over http', () => {
      const value = 'http://aeheideman.weebly.com/5/feed'
      const expected = 'weebly:blog'

      expect(weeblyHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for a page slug feed', () => {
      const value = 'https://bmsavid.weebly.com/wish-you-were-here/feed'
      const expected = 'weebly:blog'

      expect(weeblyHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for the default blog feed', () => {
      const value = 'https://sounditoutphonics.weebly.com/blog/feed'
      const expected = 'weebly:blog'

      expect(weeblyHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for a feed with a capitalised route word', () => {
      const value = 'https://bmsavid.weebly.com/1/FEED'
      const expected = 'weebly:blog'

      expect(weeblyHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a feed path under a robots file', () => {
      const value = 'https://ondertschuim.weebly.com/robots.txt/feed'

      expect(weeblyHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path under a sitemap file', () => {
      const value = 'https://istanbulservis.weebly.com/sitemap.xml/feed'

      expect(weeblyHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://bmsavid.weebly.com/wish-you-were-here'

      expect(weeblyHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for the root', () => {
      const value = 'https://bmsavid.weebly.com/'

      expect(weeblyHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://blog.bmsavid.weebly.com/1/feed'

      expect(weeblyHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://weebly.com/1/feed'

      expect(weeblyHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/1/feed'

      expect(weeblyHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://bmsavid.weebly.com/1/feed', { key: 'weebly:blog', label: 'Blog' }],
      ['http://aeheideman.weebly.com/5/feed', { key: 'weebly:blog', label: 'Blog' }],
      ['https://bmsavid.weebly.com/wish-you-were-here/feed', { key: 'weebly:blog', label: 'Blog' }],
      ['https://sounditoutphonics.weebly.com/blog/feed', { key: 'weebly:blog', label: 'Blog' }],
      ['https://bmsavid.weebly.com/1/FEED', { key: 'weebly:blog', label: 'Blog' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [weeblyHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
