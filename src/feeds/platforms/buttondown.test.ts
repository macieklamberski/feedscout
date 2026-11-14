import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type ButtondownUrl, buttondownHandler, parseButtondownUrl } from './buttondown.js'

describe('parseButtondownUrl', () => {
  it('should return the newsletter for a newsletter page', () => {
    const expected: ButtondownUrl = { kind: 'newsletter', username: 'cassidoo' }

    expect(parseButtondownUrl('https://buttondown.com/cassidoo')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseButtondownUrl('https://buttondown.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseButtondownUrl('https://example.com/cassidoo')).toBeUndefined()
  })
})

describe('buttondownHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://buttondown.com/cassidoo'],
      [true, 'https://www.buttondown.com/user'],
      [false, 'https://buttondown.com'],
      [true, 'https://buttondown.email/cassidoo'],
      [true, 'https://www.buttondown.email/cassidoo'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(buttondownHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(buttondownHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(buttondownHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return feed URL for newsletter', () => {
      const value = 'https://buttondown.com/cassidoo'
      const expected = [
        {
          uri: 'https://buttondown.com/cassidoo/rss',
          hint: { key: 'buttondown:newsletter', label: 'Newsletter' },
        },
      ]

      expect(buttondownHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://buttondown.com/cassidoo/archive'
      const expected = [
        {
          uri: 'https://buttondown.com/cassidoo/rss',
          hint: { key: 'buttondown:newsletter', label: 'Newsletter' },
        },
      ]

      expect(buttondownHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://buttondown.com/'

      expect(buttondownHandler.resolve(value)).toEqual([])
    })

    it('should canonicalise legacy buttondown.email host to buttondown.com feed', () => {
      const value = 'https://buttondown.email/cassidoo'
      const expected = [
        {
          uri: 'https://buttondown.com/cassidoo/rss',
          hint: { key: 'buttondown:newsletter', label: 'Newsletter' },
        },
      ]

      expect(buttondownHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the newsletter key for a newsletter feed', () => {
      const value = 'https://buttondown.com/alice/rss'
      const expected: DiscoverUriHint = { key: 'buttondown:newsletter', label: 'Newsletter' }

      expect(buttondownHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the newsletter key for a newsletter feed over http on the www host', () => {
      const value = 'http://www.buttondown.com/alice/rss'
      const expected: DiscoverUriHint = { key: 'buttondown:newsletter', label: 'Newsletter' }

      expect(buttondownHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the newsletter key for a newsletter feed on the legacy host', () => {
      const value = 'https://buttondown.email/alice/rss'
      const expected: DiscoverUriHint = { key: 'buttondown:newsletter', label: 'Newsletter' }

      expect(buttondownHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the newsletter key for a newsletter feed with a dotted username', () => {
      const value = 'https://buttondown.com/alice.example/rss'
      const expected: DiscoverUriHint = { key: 'buttondown:newsletter', label: 'Newsletter' }

      expect(buttondownHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a newsletter page', () => {
      const value = 'https://buttondown.com/alice'

      expect(buttondownHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/alice/rss'

      expect(buttondownHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'buttondown:newsletter', label: 'Newsletter' }
    const ownFeeds: Array<string> = [
      'https://buttondown.com/alice/rss',
      'http://buttondown.com/alice/rss',
      'https://www.buttondown.com/alice/rss',
      'https://buttondown.email/alice/rss',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [buttondownHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
