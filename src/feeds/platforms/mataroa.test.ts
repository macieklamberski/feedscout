import { describe, expect, it } from 'bun:test'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type MataroaUrl, mataroaHandler, parseMataroaUrl } from './mataroa.js'

describe('parseMataroaUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const value = 'https://jane.mataroa.blog/'
    const expected: MataroaUrl = { kind: 'blog', blog: 'jane' }

    expect(parseMataroaUrl(value)).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseMataroaUrl('https://example.com/')).toBeUndefined()
  })
})

describe('mataroaHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.mataroa.blog'],
      [false, 'https://blog.example.mataroa.blog'],
      [false, 'https://mataroa.blog'],
      [false, 'https://www.mataroa.blog'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(mataroaHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(mataroaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Mataroa', () => {
      expect(mataroaHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://alice.mataroa.blog'
      const expected = [
        {
          uri: 'https://alice.mataroa.blog/rss/',
          hint: { key: 'mataroa:blog', label: 'Blog' },
        },
      ]

      expect(mataroaHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.mataroa.blog/some-article-slug'
      const expected = [
        {
          uri: 'https://alice.mataroa.blog/rss/',
          hint: { key: 'mataroa:blog', label: 'Blog' },
        },
      ]

      expect(mataroaHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of the page', () => {
      const value = 'http://alice.mataroa.blog/some-article-slug'
      const expected = [
        {
          uri: 'http://alice.mataroa.blog/rss/',
          hint: { key: 'mataroa:blog', label: 'Blog' },
        },
      ]

      expect(mataroaHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the blog key for a blog feed', () => {
      const value = 'https://alice.mataroa.blog/rss/'
      const expected = 'mataroa:blog'

      expect(mataroaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for a blog feed without the trailing slash', () => {
      const value = 'https://alice.mataroa.blog/rss'
      const expected = 'mataroa:blog'

      expect(mataroaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for a blog feed over http', () => {
      const value = 'http://alice.mataroa.blog/rss/'
      const expected = 'mataroa:blog'

      expect(mataroaHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a post page', () => {
      const value = 'https://alice.mataroa.blog/blog/rss/'

      expect(mataroaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the apex domain', () => {
      const value = 'https://mataroa.blog/rss/'

      expect(mataroaHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://blog.example.mataroa.blog/rss/'

      expect(mataroaHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('discoverUrisFromPlatform', () => {
    const values = [
      'https://alice.mataroa.blog/rss/',
      'https://alice.mataroa.blog/rss',
      'http://alice.mataroa.blog/rss',
    ]

    it.each(values)('should return %s as given with its key', async (value) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [mataroaHandler],
        baseUrl: value,
      }
      const expected = [{ uri: value, hint: { key: 'mataroa:blog', label: 'Blog' } }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
