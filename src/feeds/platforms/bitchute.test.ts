import { describe, expect, it } from 'bun:test'
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

  it('should return undefined for an uppercase channel prefix', () => {
    expect(parseBitchuteUrl('https://www.bitchute.com/Channel/example/')).toBeUndefined()
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
})
