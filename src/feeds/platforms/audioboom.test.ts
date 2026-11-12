import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type AudioboomUrl, audioboomHandler, parseAudioboomUrl } from './audioboom.js'

describe('parseAudioboomUrl', () => {
  it('should return the channel for a channel page', () => {
    const expected: AudioboomUrl = { kind: 'channel', channelId: '5071123' }

    expect(parseAudioboomUrl('https://audioboom.com/channels/5071123')).toEqual(expected)
  })

  it('should return the channel for a channel page with its slug', () => {
    const expected: AudioboomUrl = { kind: 'channel', channelId: '5071123' }

    expect(parseAudioboomUrl('https://audioboom.com/channels/5071123-front-page-tech')).toEqual(
      expected,
    )
  })

  it('should return a one-digit channel id whole', () => {
    const expected: AudioboomUrl = { kind: 'channel', channelId: '1' }

    expect(parseAudioboomUrl('https://audioboom.com/channels/1')).toEqual(expected)
  })

  it('should return undefined for a channel id with a letter', () => {
    expect(parseAudioboomUrl('https://audioboom.com/channels/5071123abc')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseAudioboomUrl('https://audioboom.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseAudioboomUrl('https://example.com/channels/5071123')).toBeUndefined()
  })
})

describe('audioboomHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://audioboom.com/channels/5071123'],
      [true, 'https://www.audioboom.com/channels/5071123'],
      [false, 'https://audioboom.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(audioboomHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(audioboomHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(audioboomHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return podcast feed for channel', () => {
      const value = 'https://audioboom.com/channels/5071123'
      const expected = [
        {
          uri: 'https://audioboom.com/channels/5071123.rss',
          hint: { key: 'audioboom:podcast', label: 'Podcast' },
        },
      ]

      expect(audioboomHandler.resolve(value)).toEqual(expected)
    })

    it('should return podcast feed for channel with a capitalized channels segment', () => {
      const value = 'https://audioboom.com/Channels/5071123'
      const expected = [
        {
          uri: 'https://audioboom.com/channels/5071123.rss',
          hint: { key: 'audioboom:podcast', label: 'Podcast' },
        },
      ]

      expect(audioboomHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://audioboom.com/channels/5071123/some-episode'
      const expected = [
        {
          uri: 'https://audioboom.com/channels/5071123.rss',
          hint: { key: 'audioboom:podcast', label: 'Podcast' },
        },
      ]

      expect(audioboomHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://audioboom.com/'

      expect(audioboomHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for non-channel paths', () => {
      const value = 'https://audioboom.com/posts/12345'

      expect(audioboomHandler.resolve(value)).toEqual([])
    })
  })

  describe('getFeedKey', () => {
    it('should return the podcast key for a channel feed', () => {
      const value = 'https://audioboom.com/channels/5016155.rss'
      const expected = 'audioboom:podcast'

      expect(audioboomHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the podcast key for a channel feed on the www host', () => {
      const value = 'https://www.audioboom.com/channels/5050302.rss'
      const expected = 'audioboom:podcast'

      expect(audioboomHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a channel page', () => {
      const value = 'https://audioboom.com/channels/5016155'

      expect(audioboomHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a playlist feed', () => {
      const value = 'https://audioboom.com/playlists/1303121.rss'

      expect(audioboomHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/channels/5016155.rss'

      expect(audioboomHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a channel feed as itself', async () => {
      const value = 'https://audioboom.com/channels/5016155.rss'
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [audioboomHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: value,
          hint: { key: 'audioboom:podcast', label: 'Podcast' },
        },
      ]

      expect(result).toEqual(expected)
    })
  })
})
