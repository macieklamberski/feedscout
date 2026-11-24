import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type MataroaUrl, mataroaHandler, parseMataroaUrl } from './mataroa.js'

describe('parseMataroaUrl', () => {
  it('should return the blog for a blog subdomain', () => {
    const value = 'https://jane.mataroa.blog/'
    const expected: MataroaUrl = { kind: 'blog' }

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

  describe('getFeedHint', () => {
    it('should return the blog hint for a blog feed', () => {
      const value = 'https://alice.mataroa.blog/rss/'
      const expected: DiscoverUriHint = { key: 'mataroa:blog', label: 'Blog' }

      expect(mataroaHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('discoverUrisFromPlatform', () => {
    it('should return a blog feed without the trailing slash as given with its key', async () => {
      const value = 'https://alice.mataroa.blog/rss'
      const options = {
        ...defaultPlatformOptions,
        handlers: [mataroaHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.mataroa.blog/rss',
          hint: { key: 'mataroa:blog', label: 'Blog' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
