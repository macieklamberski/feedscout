import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type NiconicoUrl, niconicoHandler, parseNiconicoUrl } from './niconico.js'

const videosHint: DiscoverUriHint = { key: 'niconico:videos', label: 'Videos' }
const liveHint: DiscoverUriHint = { key: 'niconico:live', label: 'Live' }
const blogHint: DiscoverUriHint = { key: 'niconico:blog', label: 'Blog' }

const feedCases: Array<[string, DiscoverUriHint]> = [
  ['https://ch.nicovideo.jp/examplechannel/video?rss=2.0', videosHint],
  ['https://ch.nicovideo.jp/examplechannel/live?rss=2.0', liveHint],
  ['https://ch.nicovideo.jp/examplechannel/blomaga/nico/feed', blogHint],
  ['http://ch.nicovideo.jp/examplechannel/video?rss=2.0', videosHint], // http
  ['https://ch.nicovideo.jp/examplechannel/live/?rss=2.0', liveHint], // Trailing slash
  ['https://ch.nicovideo.jp/examplechannel/blomaga/nico/feed/', blogHint], // Trailing slash
]

describe('parseNiconicoUrl', () => {
  it('should return the channel for a channel page', () => {
    const expected: NiconicoUrl = { kind: 'channel', channel: 'examplechannel' }

    expect(parseNiconicoUrl('https://ch.nicovideo.jp/examplechannel')).toEqual(expected)
  })

  it('should return the live page of a channel', () => {
    const expected: NiconicoUrl = { kind: 'live', channel: 'examplechannel' }

    expect(parseNiconicoUrl('https://ch.nicovideo.jp/examplechannel/live')).toEqual(expected)
  })

  it('should return the blomaga page of a channel', () => {
    const expected: NiconicoUrl = { kind: 'blomaga', channel: 'examplechannel' }

    expect(parseNiconicoUrl('https://ch.nicovideo.jp/examplechannel/Blomaga')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseNiconicoUrl('https://example.com/examplechannel')).toBeUndefined()
  })
})

describe('niconicoHandler', () => {
  describe('match', () => {
    it('should match a channel page', () => {
      expect(niconicoHandler.match('https://ch.nicovideo.jp/examplechannel')).toBe(true)
    })

    it('should match a channel section page', () => {
      expect(niconicoHandler.match('https://ch.nicovideo.jp/examplechannel/blomaga')).toBe(true)
    })

    it('should match a channel whose slug is a section word', () => {
      expect(niconicoHandler.match('https://ch.nicovideo.jp/live')).toBe(true)
    })

    it('should not match a file at the root', () => {
      expect(niconicoHandler.match('https://ch.nicovideo.jp/favicon.ico')).toBe(false)
    })

    it('should not match the home page', () => {
      expect(niconicoHandler.match('https://ch.nicovideo.jp/')).toBe(false)
    })

    it('should not match another nicovideo host', () => {
      expect(niconicoHandler.match('https://www.nicovideo.jp/user/12345')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside niconico', () => {
      expect(niconicoHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the video, live and blog feeds for a channel page', () => {
      const value = 'https://ch.nicovideo.jp/examplechannel'
      const expected = [
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/video?rss=2.0',
          hint: { key: 'niconico:videos', label: 'Videos' },
        },
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/live?rss=2.0',
          hint: { key: 'niconico:live', label: 'Live' },
        },
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/blomaga/nico/feed',
          hint: { key: 'niconico:blog', label: 'Blog' },
        },
      ]

      expect(niconicoHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the channel case', () => {
      const value = 'https://ch.nicovideo.jp/ExampleChannel/video'
      const expected = [
        {
          uri: 'https://ch.nicovideo.jp/ExampleChannel/video?rss=2.0',
          hint: { key: 'niconico:videos', label: 'Videos' },
        },
        {
          uri: 'https://ch.nicovideo.jp/ExampleChannel/live?rss=2.0',
          hint: { key: 'niconico:live', label: 'Live' },
        },
        {
          uri: 'https://ch.nicovideo.jp/ExampleChannel/blomaga/nico/feed',
          hint: { key: 'niconico:blog', label: 'Blog' },
        },
      ]

      expect(niconicoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the live feed first for a live page', () => {
      const value = 'https://ch.nicovideo.jp/examplechannel/live'
      const expected = [
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/live?rss=2.0',
          hint: { key: 'niconico:live', label: 'Live' },
        },
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/video?rss=2.0',
          hint: { key: 'niconico:videos', label: 'Videos' },
        },
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/blomaga/nico/feed',
          hint: { key: 'niconico:blog', label: 'Blog' },
        },
      ]

      expect(niconicoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the blog feed first for a blog article page', () => {
      const value = 'https://ch.nicovideo.jp/examplechannel/Blomaga/ar1234567'
      const expected = [
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/blomaga/nico/feed',
          hint: { key: 'niconico:blog', label: 'Blog' },
        },
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/video?rss=2.0',
          hint: { key: 'niconico:videos', label: 'Videos' },
        },
        {
          uri: 'https://ch.nicovideo.jp/examplechannel/live?rss=2.0',
          hint: { key: 'niconico:live', label: 'Live' },
        },
      ]

      expect(niconicoHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the videos key for a video feed', () => {
      const value = 'https://ch.nicovideo.jp/examplechannel/video?rss=2.0'
      const expected = 'niconico:videos'

      expect(niconicoHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the live key for a live feed', () => {
      const value = 'https://ch.nicovideo.jp/examplechannel/live?rss=2.0'
      const expected = 'niconico:live'

      expect(niconicoHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the blog key for a blog feed', () => {
      const value = 'https://ch.nicovideo.jp/examplechannel/blomaga/nico/feed'
      const expected = 'niconico:blog'

      expect(niconicoHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the videos key for a video feed over http', () => {
      const value = 'http://ch.nicovideo.jp/examplechannel/video?rss=2.0'
      const expected = 'niconico:videos'

      expect(niconicoHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a video page', () => {
      const value = 'https://ch.nicovideo.jp/examplechannel/video'

      expect(niconicoHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a video page with another rss value', () => {
      const value = 'https://ch.nicovideo.jp/examplechannel/video?rss=atom'

      expect(niconicoHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a channel page', () => {
      const value = 'https://ch.nicovideo.jp/examplechannel'

      expect(niconicoHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/examplechannel/video?rss=2.0'

      expect(niconicoHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('as a feed URL input', () => {
    it.each(feedCases)('should return %s as given', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [niconicoHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
