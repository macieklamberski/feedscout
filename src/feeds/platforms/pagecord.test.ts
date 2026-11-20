import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type PagecordUrl, pagecordHandler, parsePagecordUrl } from './pagecord.js'

describe('parsePagecordUrl', () => {
  it('should return the blog for a subdomain', () => {
    const expected: PagecordUrl = { kind: 'blog' }

    expect(parsePagecordUrl('https://example.pagecord.com/')).toEqual(expected)
  })

  it('should return the tag for a page filtered by tag', () => {
    const value = 'https://example.pagecord.com/?tag=photography'
    const expected: PagecordUrl = { kind: 'tag', tag: 'photography' }

    expect(parsePagecordUrl(value)).toEqual(expected)
  })

  it('should return undefined for the www host', () => {
    expect(parsePagecordUrl('https://www.pagecord.com/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parsePagecordUrl('https://blog.example.pagecord.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parsePagecordUrl('https://example.com/')).toBeUndefined()
  })
})

describe('pagecordHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://alice.pagecord.com'],
      [false, 'https://blog.example.pagecord.com'],
      [false, 'https://pagecord.com'],
      [false, 'https://www.pagecord.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(pagecordHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(pagecordHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Pagecord', () => {
      expect(pagecordHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for blog', () => {
      const value = 'https://alice.pagecord.com'
      const expected = [
        {
          uri: 'https://alice.pagecord.com/feed.xml',
          hint: { key: 'pagecord:blog', label: 'Blog' },
        },
      ]

      expect(pagecordHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of path', () => {
      const value = 'https://alice.pagecord.com/some-post-slug'
      const expected = [
        {
          uri: 'https://alice.pagecord.com/feed.xml',
          hint: { key: 'pagecord:blog', label: 'Blog' },
        },
      ]

      expect(pagecordHandler.resolve(value)).toEqual(expected)
    })

    it('should return the tag feed for a page filtered by tag', () => {
      const value = 'https://alice.pagecord.com/?tag=photography'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.pagecord.com/feed.xml?tag=photography',
          hint: { key: 'pagecord:tag', label: 'Tag' },
        },
        {
          uri: 'https://alice.pagecord.com/feed.xml',
          hint: { key: 'pagecord:blog', label: 'Blog' },
        },
      ]

      expect(pagecordHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feed under the page scheme for an http blog page', () => {
      const value = 'http://alice.pagecord.com/some-post-slug'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.pagecord.com/feed.xml',
          hint: { key: 'pagecord:blog', label: 'Blog' },
        },
      ]

      expect(pagecordHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the tag hint for the extensionless feed filtered by tag', () => {
      const value = 'https://alice.pagecord.com/feed?tag=photography'
      const expected: DiscoverUriHint = { key: 'pagecord:tag', label: 'Tag' }

      expect(pagecordHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a blog feed as itself', async () => {
      const value = 'https://alice.pagecord.com/feed.xml'
      const options = {
        ...defaultPlatformOptions,
        handlers: [pagecordHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'pagecord:blog', label: 'Blog' } },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
