import { describe, expect, it } from 'bun:test'
import type { PeertubeUrl } from './peertube.js'
import { isPeertubeHeaders, parsePeertubeUrl, peertubeHandler } from './peertube.js'

const peertubeHeaders = new Headers({ 'x-powered-by': 'PeerTube' })

describe('isPeertubeHeaders', () => {
  it('should return true for the PeerTube powered-by header', () => {
    expect(isPeertubeHeaders(peertubeHeaders)).toBe(true)
  })

  it('should return false when the header is absent', () => {
    expect(isPeertubeHeaders(new Headers())).toBe(false)
    expect(isPeertubeHeaders(new Headers({ 'x-powered-by': 'Express' }))).toBe(false)
  })
})

describe('parsePeertubeUrl', () => {
  it('should return the channel for a channel page', () => {
    const expected: PeertubeUrl = { kind: 'channel', name: 'news' }

    expect(parsePeertubeUrl('https://example.org/c/news')).toEqual(expected)
  })

  it('should return the channel for a channel subpage', () => {
    const expected: PeertubeUrl = { kind: 'channel', name: 'news' }

    expect(parsePeertubeUrl('https://example.org/c/news/videos')).toEqual(expected)
  })

  it('should return the channel with its remote handle', () => {
    const expected: PeertubeUrl = { kind: 'channel', name: 'news@example.com' }

    expect(parsePeertubeUrl('https://example.org/c/news@example.com')).toEqual(expected)
  })

  it('should return the account for an account page', () => {
    const expected: PeertubeUrl = { kind: 'account', name: 'alice' }

    expect(parsePeertubeUrl('https://example.org/a/alice')).toEqual(expected)
  })

  it('should return the account for a capitalized prefix', () => {
    const expected: PeertubeUrl = { kind: 'account', name: 'alice' }

    expect(parsePeertubeUrl('https://example.org/A/alice')).toEqual(expected)
  })

  it('should return the account for an account subpage', () => {
    const expected: PeertubeUrl = { kind: 'account', name: 'alice' }

    expect(parsePeertubeUrl('https://example.org/a/alice/video-channels')).toEqual(expected)
  })

  it('should return the channel for a capitalized prefix', () => {
    const expected: PeertubeUrl = { kind: 'channel', name: 'news' }

    expect(parsePeertubeUrl('https://example.org/C/news')).toEqual(expected)
  })

  it('should return undefined for a video page', () => {
    expect(parsePeertubeUrl('https://example.org/w/abc123')).toBeUndefined()
  })

  it('should return undefined for the instance home', () => {
    expect(parsePeertubeUrl('https://example.org/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parsePeertubeUrl('not-a-url')).toBeUndefined()
  })
})

describe('peertubeHandler', () => {
  describe('match', () => {
    it('should match a PeerTube page', () => {
      expect(peertubeHandler.match('https://example.org/c/channel', '', peertubeHeaders)).toBe(true)
    })

    it('should not match without the header', () => {
      expect(peertubeHandler.match('https://example.org/c/channel')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the channel and instance feeds', () => {
      const value = 'https://example.org/c/channel/videos'
      const expected = [
        {
          uri: 'https://example.org/feeds/videos.xml?videoChannelName=channel',
          hint: { key: 'peertube:channel', label: 'Channel' },
        },
        {
          uri: 'https://example.org/feeds/videos.xml',
          hint: { key: 'peertube:instance', label: 'Instance' },
        },
      ]

      expect(peertubeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the account feed on an account page', () => {
      const value = 'https://example.org/a/alice'
      const expected = [
        {
          uri: 'https://example.org/feeds/videos.xml?accountName=alice',
          hint: { key: 'peertube:account', label: 'Account' },
        },
        {
          uri: 'https://example.org/feeds/videos.xml',
          hint: { key: 'peertube:instance', label: 'Instance' },
        },
      ]

      expect(peertubeHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the instance feed elsewhere', () => {
      const value = 'https://example.org/videos/trending'
      const expected = [
        {
          uri: 'https://example.org/feeds/videos.xml',
          hint: { key: 'peertube:instance', label: 'Instance' },
        },
      ]

      expect(peertubeHandler.resolve(value)).toEqual(expected)
    })
  })
})
