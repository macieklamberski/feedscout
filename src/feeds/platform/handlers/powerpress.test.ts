import { describe, expect, it } from 'bun:test'
import { isPowerpressHtml, powerpressHandler } from './powerpress.js'

const powerpressHtml = '<script>function powerpress_pinw(url){window.open(url)}</script>'
const otherHtml = '<script>function playerInit(url){}</script>'

describe('isPowerpressHtml', () => {
  it('should return true for the player function the plugin writes', () => {
    expect(isPowerpressHtml(powerpressHtml)).toBe(true)
  })

  it('should return false for another player', () => {
    expect(isPowerpressHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isPowerpressHtml('')).toBe(false)
  })
})

describe('powerpressHandler', () => {
  describe('match', () => {
    it('should match a site running the plugin', () => {
      expect(powerpressHandler.match('https://example.com/', powerpressHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(powerpressHandler.match('https://example.com/')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(powerpressHandler.match('not-a-url', powerpressHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the podcast feed rather than the blog feed', () => {
      const value = 'https://example.com/an-episode/'
      const expected = [
        {
          uri: 'https://example.com/feed/podcast/',
          hint: { key: 'powerpress:podcast', label: 'Podcast' },
        },
      ]

      expect(powerpressHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for invalid URLs', () => {
      expect(powerpressHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
