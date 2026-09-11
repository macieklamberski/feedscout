import { describe, expect, it } from 'bun:test'
import { bitchuteHandler } from './bitchute.js'

describe('bitchuteHandler', () => {
  describe('match', () => {
    it('should match a channel URL', () => {
      expect(bitchuteHandler.match('https://www.bitchute.com/channel/example/')).toBe(true)
      expect(bitchuteHandler.match('https://bitchute.com/channel/example')).toBe(true)
    })

    it('should not match a channel URL without a slug', () => {
      expect(bitchuteHandler.match('https://www.bitchute.com/channel/')).toBe(false)
    })

    it('should not match non-channel paths', () => {
      expect(bitchuteHandler.match('https://www.bitchute.com/video/abc123/')).toBe(false)
      expect(bitchuteHandler.match('https://www.bitchute.com/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(bitchuteHandler.match('https://example.com/channel/example')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(bitchuteHandler.match('not-a-url')).toBe(false)
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

    it('should ignore trailing path segments', () => {
      const value = 'https://www.bitchute.com/channel/example/videos/'
      const expected = [
        {
          uri: 'https://www.bitchute.com/feeds/rss/channel/example/',
          hint: { key: 'bitchute:channel', label: 'Channel' },
        },
      ]

      expect(bitchuteHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for non-channel paths', () => {
      expect(bitchuteHandler.resolve('https://www.bitchute.com/video/abc123/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(bitchuteHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
