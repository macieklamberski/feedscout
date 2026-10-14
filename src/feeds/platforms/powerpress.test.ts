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

    it('should return the podcast feed of a site under a sub-path', () => {
      const value = 'https://example.com/blog/an-episode/'
      const content = `
        <a
          href="https://example.com/blog/?powerpress_pinw=123-podcast"
          onclick="return powerpress_pinw('https://example.com/blog/?powerpress_pinw=123-podcast');"
        >Play in new window</a>
      `
      const expected = [
        {
          uri: 'https://example.com/blog/feed/podcast/',
          hint: { key: 'powerpress:podcast', label: 'Podcast' },
        },
      ]

      expect(powerpressHandler.resolve(value, content)).toEqual(expected)
    })

    it('should ignore a player link on another host', () => {
      const value = 'https://example.com/an-episode/'
      const content = "powerpress_pinw('https://example.org/blog/?powerpress_pinw=123-podcast')"
      const expected = [
        {
          uri: 'https://example.com/feed/podcast/',
          hint: { key: 'powerpress:podcast', label: 'Podcast' },
        },
      ]

      expect(powerpressHandler.resolve(value, content)).toEqual(expected)
    })

    it('should ignore a player link of a site the page is not under', () => {
      const value = 'https://example.com/an-episode/'
      const content = "powerpress_pinw('https://example.com/blog/?powerpress_pinw=123-podcast')"
      const expected = [
        {
          uri: 'https://example.com/feed/podcast/',
          hint: { key: 'powerpress:podcast', label: 'Podcast' },
        },
      ]

      expect(powerpressHandler.resolve(value, content)).toEqual(expected)
    })

    it('should stay linear on a page that repeats the player call', async () => {
      const content = "powerpress_pinw('".repeat(12_000)
      const start = performance.now()

      await powerpressHandler.resolve('https://example.com/', content)

      expect(performance.now() - start).toBeLessThan(1000)
    })
  })
})
