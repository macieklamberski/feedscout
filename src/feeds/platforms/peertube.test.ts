import { describe, expect, it } from 'bun:test'
import { isPeertubeHeaders, peertubeHandler } from './peertube.js'

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

describe('peertubeHandler', () => {
  describe('match', () => {
    it('should match a PeerTube page', () => {
      expect(peertubeHandler.match('https://example.org/c/channel', '', peertubeHeaders)).toBe(true)
    })

    it('should not match without the header', () => {
      expect(peertubeHandler.match('https://example.org/c/channel')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(peertubeHandler.match('not-a-url', '', peertubeHeaders)).toBe(false)
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

    it('should return an empty array for invalid URLs', () => {
      expect(peertubeHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
