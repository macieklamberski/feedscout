import { describe, expect, it } from 'bun:test'
import { funkwhaleHandler, isFunkwhaleHtml } from './funkwhale.js'

const funkwhaleHtml = '<meta name="generator" content="Funkwhale" />'
const otherHtml = '<meta name="generator" content="Castopod 1.0">'

describe('isFunkwhaleHtml', () => {
  it('should return true for the Funkwhale generator meta tag', () => {
    expect(isFunkwhaleHtml(funkwhaleHtml)).toBe(true)
  })

  it('should return false for another platform', () => {
    expect(isFunkwhaleHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isFunkwhaleHtml('')).toBe(false)
  })
})

describe('funkwhaleHandler', () => {
  describe('match', () => {
    it('should match a channel page', () => {
      expect(funkwhaleHandler.match('https://example.org/channels/alice', funkwhaleHtml)).toBe(true)
    })

    it('should not match a page outside a channel', () => {
      expect(funkwhaleHandler.match('https://example.org/library', funkwhaleHtml)).toBe(false)
    })

    it('should not match without content', () => {
      expect(funkwhaleHandler.match('https://example.org/channels/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(funkwhaleHandler.match('not-a-url', funkwhaleHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the channel feed on the v1 path', () => {
      const value = 'https://example.org/channels/alice'
      const expected = [
        {
          uri: 'https://example.org/api/v1/channels/alice/rss',
          hint: { key: 'funkwhale:channel', label: 'Channel' },
        },
      ]

      expect(funkwhaleHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array outside a channel', () => {
      expect(funkwhaleHandler.resolve('https://example.org/library')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(funkwhaleHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
