import { describe, expect, it } from 'bun:test'
import { hubzillaHandler, isHubzillaHtml } from './hubzilla.js'

const hubzillaHtml = '<meta name="generator" content="hubzilla" />'
const otherHtml = '<meta name="generator" content="friendica 2026.05">'

describe('isHubzillaHtml', () => {
  it('should return true for the hubzilla generator meta tag', () => {
    expect(isHubzillaHtml(hubzillaHtml)).toBe(true)
  })

  it('should return false for another platform', () => {
    expect(isHubzillaHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isHubzillaHtml('')).toBe(false)
  })
})

describe('hubzillaHandler', () => {
  describe('match', () => {
    it('should match a channel page', () => {
      expect(hubzillaHandler.match('https://example.org/channel/alice', hubzillaHtml)).toBe(true)
    })

    it('should not match a page outside a channel', () => {
      expect(hubzillaHandler.match('https://example.org/', hubzillaHtml)).toBe(false)
    })

    it('should not match without content', () => {
      expect(hubzillaHandler.match('https://example.org/channel/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(hubzillaHandler.match('not-a-url', hubzillaHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the channel feed', () => {
      const value = 'https://example.org/channel/alice'
      const expected = [
        {
          uri: 'https://example.org/feed/alice',
          hint: { key: 'hubzilla:channel', label: 'Channel' },
        },
      ]

      expect(hubzillaHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array outside a channel', () => {
      expect(hubzillaHandler.resolve('https://example.org/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(hubzillaHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
