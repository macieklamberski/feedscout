import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { BitchuteUrl } from './bitchute.js'
import { bitchuteHandler, parseBitchuteUrl } from './bitchute.js'

describe('parseBitchuteUrl', () => {
  it('should return the channel for a channel page', () => {
    const expected: BitchuteUrl = { kind: 'channel', channel: 'example' }

    expect(parseBitchuteUrl('https://www.bitchute.com/channel/example/')).toEqual(expected)
  })

  it('should return the channel for the host without www', () => {
    const expected: BitchuteUrl = { kind: 'channel', channel: 'example' }

    expect(parseBitchuteUrl('https://bitchute.com/channel/example')).toEqual(expected)
  })

  it('should return the channel for a channel subpage', () => {
    const expected: BitchuteUrl = { kind: 'channel', channel: 'example' }

    expect(parseBitchuteUrl('https://www.bitchute.com/channel/example/videos/')).toEqual(expected)
  })

  it('should return undefined for a channel path without a slug', () => {
    expect(parseBitchuteUrl('https://www.bitchute.com/channel/')).toBeUndefined()
  })

  it('should return the channel for a capitalized channel prefix', () => {
    const expected: BitchuteUrl = { kind: 'channel', channel: 'example' }

    expect(parseBitchuteUrl('https://www.bitchute.com/Channel/example/')).toEqual(expected)
  })

  it('should return undefined for a video page', () => {
    expect(parseBitchuteUrl('https://www.bitchute.com/video/abc123/')).toBeUndefined()
  })

  it('should return undefined for the homepage', () => {
    expect(parseBitchuteUrl('https://www.bitchute.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseBitchuteUrl('https://example.com/channel/example')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseBitchuteUrl('not-a-url')).toBeUndefined()
  })
})

describe('bitchuteHandler', () => {
  describe('match', () => {
    it('should match a channel URL', () => {
      expect(bitchuteHandler.match('https://www.bitchute.com/channel/example/')).toBe(true)
    })

    it('should not match URLs that name no channel', () => {
      expect(bitchuteHandler.match('https://www.bitchute.com/video/abc123/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the channel feed', () => {
      const value = 'https://www.bitchute.com/channel/example/'
      const expected = [
        {
          uri: 'https://www.bitchute.com/feeds/rss/channel/example/',
          hint: { key: 'bitchute:channel', label: 'Channel' },
        },
      ]

      expect(bitchuteHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array when the URL names no channel', () => {
      expect(bitchuteHandler.resolve('https://www.bitchute.com/video/abc123/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the channel hint for a channel feed', () => {
      const value = 'https://www.bitchute.com/feeds/rss/channel/uagSShqJKtfp/'
      const expected: DiscoverUriHint = { key: 'bitchute:channel', label: 'Channel' }

      expect(bitchuteHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the channel hint for a channel feed named by a slug', () => {
      const value = 'https://www.bitchute.com/feeds/rss/channel/clemens/'
      const expected: DiscoverUriHint = { key: 'bitchute:channel', label: 'Channel' }

      expect(bitchuteHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the channel hint for a channel feed on the api host', () => {
      const value = 'https://api.bitchute.com/feeds/rss/channel/sean_last/'
      const expected: DiscoverUriHint = { key: 'bitchute:channel', label: 'Channel' }

      expect(bitchuteHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a channel page', () => {
      const value = 'https://www.bitchute.com/channel/clemens/'

      expect(bitchuteHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a channel feed path on another host', () => {
      const value = 'https://example.com/feeds/rss/channel/clemens/'

      expect(bitchuteHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://www.bitchute.com/feeds/rss/channel/uagSShqJKtfp/',
        { key: 'bitchute:channel', label: 'Channel' },
      ],
      [
        'https://www.bitchute.com/feeds/rss/channel/clemens/',
        { key: 'bitchute:channel', label: 'Channel' },
      ],
      [
        'https://api.bitchute.com/feeds/rss/channel/sean_last/',
        { key: 'bitchute:channel', label: 'Channel' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [bitchuteHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
