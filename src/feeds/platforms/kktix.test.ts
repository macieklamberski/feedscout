import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type KktixUrl, kktixHandler, parseKktixUrl } from './kktix.js'

describe('parseKktixUrl', () => {
  it('should return the organizer for an organizer page', () => {
    const expected: KktixUrl = { kind: 'organizer', organizer: 'example' }

    expect(parseKktixUrl('https://example.kktix.cc/')).toEqual(expected)
  })

  it('should return the organizer for an event page', () => {
    const expected: KktixUrl = { kind: 'organizer', organizer: 'example' }

    expect(parseKktixUrl('https://example.kktix.cc/events/a1b2c3d4')).toEqual(expected)
  })

  it('should return the organizer in lowercase for an uppercase host', () => {
    const expected: KktixUrl = { kind: 'organizer', organizer: 'example' }

    expect(parseKktixUrl('https://EXAMPLE.kktix.cc/')).toEqual(expected)
  })

  it('should return undefined for the www subdomain', () => {
    expect(parseKktixUrl('https://www.kktix.cc/')).toBeUndefined()
  })

  it('should return undefined for the apex domain', () => {
    expect(parseKktixUrl('https://kktix.cc/')).toBeUndefined()
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseKktixUrl('https://a.example.kktix.cc/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseKktixUrl('https://example.com/')).toBeUndefined()
  })
})

describe('kktixHandler', () => {
  describe('match', () => {
    it('should match an organizer page', () => {
      expect(kktixHandler.match('https://example.kktix.cc/')).toBe(true)
    })

    it('should not match the www subdomain', () => {
      expect(kktixHandler.match('https://www.kktix.cc/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside KKTIX', () => {
      expect(kktixHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the events feed for an organizer page', () => {
      const value = 'https://example.kktix.cc/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.kktix.cc/events.atom?locale=zh-TW',
          hint: { key: 'kktix:events', label: 'Events' },
        },
      ]

      expect(kktixHandler.resolve(value)).toEqual(expected)
    })

    it('should return the events feed for an event page', () => {
      const value = 'https://example.kktix.cc/events/a1b2c3d4'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.kktix.cc/events.atom?locale=zh-TW',
          hint: { key: 'kktix:events', label: 'Events' },
        },
      ]

      expect(kktixHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feed under the page scheme for an http page', () => {
      const value = 'http://example.kktix.cc/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://example.kktix.cc/events.atom?locale=zh-TW',
          hint: { key: 'kktix:events', label: 'Events' },
        },
      ]

      expect(kktixHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the events hint for the events feed', () => {
      const value = 'https://example.kktix.cc/events.atom?locale=zh-TW'
      const expected: DiscoverUriHint = { key: 'kktix:events', label: 'Events' }

      expect(kktixHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the events hint for the events feed without a locale', () => {
      const value = 'https://example.kktix.cc/events.atom'
      const expected: DiscoverUriHint = { key: 'kktix:events', label: 'Events' }

      expect(kktixHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the events hint for the events feed with another locale', () => {
      const value = 'https://example.kktix.cc/events.atom?locale=ja'
      const expected: DiscoverUriHint = { key: 'kktix:events', label: 'Events' }

      expect(kktixHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for an organizer page', () => {
      const value = 'https://example.kktix.cc/events'

      expect(kktixHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the events feed on the www subdomain', () => {
      const value = 'https://www.kktix.cc/events.atom'

      expect(kktixHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for the events feed on a nested subdomain', () => {
      const value = 'https://a.example.kktix.cc/events.atom'

      expect(kktixHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })
})

describe('discoverUrisFromPlatform', () => {
  const feedUrls = [
    'https://example.kktix.cc/events.atom?locale=zh-TW',
    'https://example.kktix.cc/events.atom',
    'https://example.kktix.cc/events.atom?locale=ja',
    'https://example.kktix.cc/events.atom?locale=en',
    'http://example.kktix.cc/events.atom',
  ]

  it.each(feedUrls)('should return the feed URL as given for %s', async (value) => {
    const options = {
      ...defaultPlatformOptions,
      handlers: [kktixHandler],
      baseUrl: value,
    }
    const expected: Array<DiscoverUriEntry> = [
      {
        uri: value,
        hint: { key: 'kktix:events', label: 'Events' },
      },
    ]

    expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
  })
})
