import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { TeletypeUrl } from './teletype.js'
import { parseTeletypeUrl, teletypeHandler } from './teletype.js'

describe('parseTeletypeUrl', () => {
  it('should return the username for a blog page', () => {
    const expected: TeletypeUrl = { kind: 'blog', username: 'alice' }

    expect(parseTeletypeUrl('https://teletype.in/@alice')).toEqual(expected)
  })

  it('should return the username for a post page', () => {
    const expected: TeletypeUrl = { kind: 'blog', username: 'alice' }

    expect(parseTeletypeUrl('https://teletype.in/@alice/BJiAh0PhG')).toEqual(expected)
  })

  it('should decode an encoded username', () => {
    const expected: TeletypeUrl = { kind: 'blog', username: 'алиса' }

    expect(parseTeletypeUrl('https://teletype.in/@%D0%B0%D0%BB%D0%B8%D1%81%D0%B0')).toEqual(
      expected,
    )
  })

  it('should return undefined for a malformed encoded username', () => {
    expect(parseTeletypeUrl('https://teletype.in/@%E0%A4%A')).toBeUndefined()
  })

  it('should return undefined for paths without @ prefix', () => {
    expect(parseTeletypeUrl('https://teletype.in/')).toBeUndefined()
    expect(parseTeletypeUrl('https://teletype.in/about')).toBeUndefined()
    expect(parseTeletypeUrl('https://teletype.in/rss/alice')).toBeUndefined()
  })

  it('should return undefined for an empty username', () => {
    expect(parseTeletypeUrl('https://teletype.in/@')).toBeUndefined()
  })

  it('should return undefined for a custom domain blog', () => {
    expect(parseTeletypeUrl('https://journal.teletype.in/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseTeletypeUrl('https://example.com/@alice')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseTeletypeUrl('not-a-url')).toBeUndefined()
  })
})

describe('teletypeHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(teletypeHandler.match('https://teletype.in/@alice')).toBe(true)
    })

    it('should not match the home page', () => {
      expect(teletypeHandler.match('https://teletype.in/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the RSS and Atom feeds for a blog', () => {
      const value = 'https://teletype.in/@alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://teletype.in/rss/alice',
          hint: { key: 'teletype:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://teletype.in/atom/alice',
          hint: { key: 'teletype:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(teletypeHandler.resolve(value)).toEqual(expected)
    })

    it('should percent-encode a non-ASCII username', () => {
      const value = 'https://teletype.in/@%D0%B0%D0%BB%D0%B8%D1%81%D0%B0'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://teletype.in/rss/%D0%B0%D0%BB%D0%B8%D1%81%D0%B0',
          hint: { key: 'teletype:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://teletype.in/atom/%D0%B0%D0%BB%D0%B8%D1%81%D0%B0',
          hint: { key: 'teletype:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(teletypeHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for paths without @ prefix', () => {
      expect(teletypeHandler.resolve('https://teletype.in/about')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for an RSS feed', () => {
      const value = 'https://teletype.in/rss/bob'
      const expected: DiscoverUriHint = { key: 'teletype:posts', label: 'Posts', format: 'rss' }

      expect(teletypeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an Atom feed', () => {
      const value = 'https://teletype.in/atom/bob'
      const expected: DiscoverUriHint = { key: 'teletype:posts', label: 'Posts', format: 'atom' }

      expect(teletypeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a feed over http', () => {
      const value = 'http://teletype.in/rss/bob'
      const expected: DiscoverUriHint = { key: 'teletype:posts', label: 'Posts', format: 'rss' }

      expect(teletypeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a feed with a trailing slash', () => {
      const value = 'https://teletype.in/atom/bob/'
      const expected: DiscoverUriHint = { key: 'teletype:posts', label: 'Posts', format: 'atom' }

      expect(teletypeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a feed with an encoded username', () => {
      const value = 'https://teletype.in/rss/%D0%B0%D0%BB%D0%B8%D1%81%D0%B0'
      const expected: DiscoverUriHint = { key: 'teletype:posts', label: 'Posts', format: 'rss' }

      expect(teletypeHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://teletype.in/@bob'

      expect(teletypeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path without a username', () => {
      const value = 'https://teletype.in/rss/'

      expect(teletypeHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/rss/bob'

      expect(teletypeHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      ['https://teletype.in/rss/bob', { key: 'teletype:posts', label: 'Posts', format: 'rss' }],
      ['https://teletype.in/atom/bob', { key: 'teletype:posts', label: 'Posts', format: 'atom' }],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [teletypeHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
