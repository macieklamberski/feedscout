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

  it('should return the channel for a channel page on old.bitchute.com', () => {
    const value = 'https://old.bitchute.com/channel/example/'
    const expected: BitchuteUrl = { kind: 'channel', channel: 'example' }

    expect(parseBitchuteUrl(value)).toEqual(expected)
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
          uri: 'https://api.bitchute.com/feeds/rss/channel/example/',
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
    it('should return the channel hint for a channel feed on old.bitchute.com', () => {
      const value = 'https://old.bitchute.com/feeds/rss/channel/alicechannel/'
      const expected: DiscoverUriHint = { key: 'bitchute:channel', label: 'Channel' }

      expect(bitchuteHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a channel feed on old.bitchute.com as itself', async () => {
      const value = 'https://old.bitchute.com/feeds/rss/channel/alicechannel/'
      const expected: Array<DiscoverUriEntry> = [
        { uri: value, hint: { key: 'bitchute:channel', label: 'Channel' } },
      ]
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [bitchuteHandler],
        baseUrl: value,
      })

      expect(result).toEqual(expected)
    })
  })
})
