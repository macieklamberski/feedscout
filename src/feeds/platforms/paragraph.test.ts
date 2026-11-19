import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type ParagraphUrl, paragraphHandler, parseParagraphUrl } from './paragraph.js'

describe('parseParagraphUrl', () => {
  it('should return the blog for a user page', () => {
    const expected: ParagraphUrl = { kind: 'blog', username: 'example' }

    expect(parseParagraphUrl('https://paragraph.com/@example')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseParagraphUrl('https://paragraph.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseParagraphUrl('https://example.com/@example')).toBeUndefined()
  })
})

describe('paragraphHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://paragraph.com/@blog'],
      [true, 'https://www.paragraph.com/@user'],
      [false, 'https://paragraph.com/'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(paragraphHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(paragraphHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user blog', () => {
      const value = 'https://paragraph.com/@blog'
      const expected = [
        {
          uri: 'https://paragraph.com/@blog/rss.xml',
          hint: { key: 'paragraph:blog', label: 'Blog' },
        },
      ]

      expect(paragraphHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://paragraph.com/@optimism/some-post-slug'
      const expected = [
        {
          uri: 'https://paragraph.com/@optimism/rss.xml',
          hint: { key: 'paragraph:blog', label: 'Blog' },
        },
      ]

      expect(paragraphHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for www subdomain', () => {
      const value = 'https://www.paragraph.com/@user'
      const expected = [
        {
          uri: 'https://paragraph.com/@user/rss.xml',
          hint: { key: 'paragraph:blog', label: 'Blog' },
        },
      ]

      expect(paragraphHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://paragraph.com/'

      expect(paragraphHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for paths without @ prefix', () => {
      const value = 'https://paragraph.com/about'

      expect(paragraphHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the blog hint for the feed spelling that redirects to the linked feed', () => {
      const value = 'https://paragraph.com/@alice/feed'
      const expected: DiscoverUriHint = { key: 'paragraph:blog', label: 'Blog' }

      expect(paragraphHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a blog feed on the api host as itself', async () => {
      const value = 'https://api.paragraph.com/blogs/rss/@alice'
      const options = {
        ...defaultPlatformOptions,
        handlers: [paragraphHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://api.paragraph.com/blogs/rss/@alice',
          hint: { key: 'paragraph:blog', label: 'Blog' },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
