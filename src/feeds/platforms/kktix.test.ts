import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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

    it('should return the feed on https for an http page', () => {
      const value = 'http://example.kktix.cc/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.kktix.cc/events.atom?locale=zh-TW',
          hint: { key: 'kktix:events', label: 'Events' },
        },
      ]

      expect(kktixHandler.resolve(value)).toEqual(expected)
    })
  })
})
