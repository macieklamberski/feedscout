import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { OdyseeUrl } from './odysee.js'
import { odyseeHandler, parseOdyseeUrl } from './odysee.js'

describe('parseOdyseeUrl', () => {
  it('should return the name and claim ID for a channel page', () => {
    const value = 'https://odysee.com/@veritasium:f'
    const expected: OdyseeUrl = { kind: 'channel', name: 'veritasium', claimId: 'f' }

    expect(parseOdyseeUrl(value)).toEqual(expected)
  })

  it('should return the name for a channel without claim ID', () => {
    const expected: OdyseeUrl = { kind: 'channel', name: 'veritasium' }

    expect(parseOdyseeUrl('https://odysee.com/@veritasium')).toEqual(expected)
  })

  it('should return the channel for a page under a channel', () => {
    const value = 'https://odysee.com/@lbry:3f/some-video:abc'
    const expected: OdyseeUrl = { kind: 'channel', name: 'lbry', claimId: '3f' }

    expect(parseOdyseeUrl(value)).toEqual(expected)
  })

  it('should return the channel for the www host', () => {
    const expected: OdyseeUrl = { kind: 'channel', name: 'lbry', claimId: '3f' }

    expect(parseOdyseeUrl('https://www.odysee.com/@lbry:3f')).toEqual(expected)
  })

  it('should preserve uppercase characters in channel and claim ID', () => {
    const value = 'https://odysee.com/@Veritasium:F'
    const expected: OdyseeUrl = { kind: 'channel', name: 'Veritasium', claimId: 'F' }

    expect(parseOdyseeUrl(value)).toEqual(expected)
  })

  it('should decode an encoded channel name', () => {
    const expected: OdyseeUrl = { kind: 'channel', name: 'élise' }

    expect(parseOdyseeUrl('https://odysee.com/@%C3%A9lise')).toEqual(expected)
  })

  it('should return the channel for a percent-encoded path', () => {
    const expected: OdyseeUrl = { kind: 'channel', name: 'corbettreport', claimId: '0' }

    expect(parseOdyseeUrl('https://odysee.com/%40corbettreport%3A0')).toEqual(expected)
  })

  it('should return undefined for a malformed encoded name', () => {
    expect(parseOdyseeUrl('https://odysee.com/@%E0%A4%A')).toBeUndefined()
  })

  it('should return a full-length claim ID whole', () => {
    const value = 'https://odysee.com/@lbry:3fda836a92faaceedfe398225fb9b2ee2ed1f01a'
    const expected: OdyseeUrl = {
      kind: 'channel',
      name: 'lbry',
      claimId: '3fda836a92faaceedfe398225fb9b2ee2ed1f01a',
    }

    expect(parseOdyseeUrl(value)).toEqual(expected)
  })

  it('should return undefined for a claim ID with a non-hex character', () => {
    expect(parseOdyseeUrl('https://odysee.com/@lbry:3g')).toBeUndefined()
  })

  it('should return undefined for non-channel pages', () => {
    expect(parseOdyseeUrl('https://odysee.com/$/discover')).toBeUndefined()
    expect(parseOdyseeUrl('https://odysee.com/hello-world:a')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseOdyseeUrl('https://odysee.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseOdyseeUrl('https://example.com/@veritasium:f')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseOdyseeUrl('not-a-url')).toBeUndefined()
  })
})

describe('odyseeHandler', () => {
  describe('match', () => {
    it('should match a channel with its claim ID', () => {
      expect(odyseeHandler.match('https://odysee.com/@veritasium:f')).toBe(true)
    })

    it('should not match a channel without its claim ID', () => {
      expect(odyseeHandler.match('https://odysee.com/@veritasium')).toBe(false)
    })

    it('should not match another host', () => {
      expect(odyseeHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for channel', () => {
      const value = 'https://odysee.com/@veritasium:f'
      const expected = [
        {
          uri: 'https://odysee.com/$/rss/@veritasium:f',
          hint: { key: 'odysee:videos', label: 'Videos' },
        },
      ]

      expect(odyseeHandler.resolve(value)).toEqual(expected)
    })

    it('should write a non-ASCII channel name as is', () => {
      const value = 'https://odysee.com/@%C3%A9lise:3f'
      const expected = [
        {
          uri: 'https://odysee.com/$/rss/@élise:3f',
          hint: { key: 'odysee:videos', label: 'Videos' },
        },
      ]

      expect(odyseeHandler.resolve(value)).toEqual(expected)
    })

    it('should keep an encoded URL delimiter in a channel name encoded', () => {
      const value = 'https://odysee.com/@news%23daily:3f'
      const expected = [
        {
          uri: 'https://odysee.com/$/rss/@news%23daily:3f',
          hint: { key: 'odysee:videos', label: 'Videos' },
        },
      ]

      expect(odyseeHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for channel without claim ID', () => {
      const value = 'https://odysee.com/@veritasium'

      expect(odyseeHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the videos key for a feed with a full claim ID', () => {
      const value = 'https://odysee.com/$/rss/@CryptoRain:2feae5c0e5c62d5533e0dd78e58a7684ca94f215'
      const expected = 'odysee:videos'

      expect(odyseeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the videos key for a feed with a short claim ID', () => {
      const value = 'https://odysee.com/$/rss/@eduard.messmer:5'
      const expected = 'odysee:videos'

      expect(odyseeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the videos key for a feed with an encoded channel name', () => {
      const value = 'https://odysee.com/$/rss/@LiberumAsociaci%C3%B3n:6'
      const expected = 'odysee:videos'

      expect(odyseeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the videos key for a feed on the www host', () => {
      const value = 'https://www.odysee.com/$/rss/@eduard.messmer:5'
      const expected = 'odysee:videos'

      expect(odyseeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a channel page', () => {
      const value = 'https://odysee.com/@eduard.messmer:5'

      expect(odyseeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path without a claim ID', () => {
      const value = 'https://odysee.com/$/rss/@eduard.messmer'

      expect(odyseeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/$/rss/@eduard.messmer:5'

      expect(odyseeHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'odysee:videos', label: 'Videos' }
    const ownFeeds = [
      'https://odysee.com/$/rss/@CryptoRain:2feae5c0e5c62d5533e0dd78e58a7684ca94f215',
      'https://odysee.com/$/rss/@eduard.messmer:5',
      'https://odysee.com/$/rss/@LiberumAsociaci%C3%B3n:6',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [odyseeHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
