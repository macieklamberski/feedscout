import { describe, expect, it } from 'bun:test'
import {
  getPowerpressPage,
  isPowerpressHtml,
  type PowerpressPage,
  powerpressHandler,
} from './powerpress.js'

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

describe('getPowerpressPage', () => {
  const blogPinwHtml = `<a onclick="return powerpress_pinw('https://example.com/blog/?powerpress_pinw=123-podcast');">Play in new window</a>`

  it('should return the home url the play-in-new-window link names', () => {
    const value = 'https://example.com/blog/2024/01/episode-1/'
    const expected: PowerpressPage = { kind: 'site', homeUrl: 'https://example.com/blog' }

    expect(getPowerpressPage(value, blogPinwHtml)).toEqual(expected)
  })

  it('should return the origin without content', () => {
    const value = 'https://example.com/blog/2024/01/episode-1/'
    const expected: PowerpressPage = { kind: 'site', homeUrl: 'https://example.com' }

    expect(getPowerpressPage(value, undefined)).toEqual(expected)
  })

  it('should return the origin for a link on another host', () => {
    const value = 'https://example.org/blog/2024/01/episode-1/'
    const expected: PowerpressPage = { kind: 'site', homeUrl: 'https://example.org' }

    expect(getPowerpressPage(value, blogPinwHtml)).toEqual(expected)
  })

  it('should return the origin for a link whose root does not hold the page', () => {
    const value = 'https://example.com/blogger/2024/01/episode-1/'
    const expected: PowerpressPage = { kind: 'site', homeUrl: 'https://example.com' }

    expect(getPowerpressPage(value, blogPinwHtml)).toEqual(expected)
  })

  it('should drop the trailing slash of a home url at the root', () => {
    const value = 'https://example.com/2024/01/episode-1/'
    const content = `<a onclick="return powerpress_pinw('https://example.com/?powerpress_pinw=123-podcast');">Play in new window</a>`
    const expected: PowerpressPage = { kind: 'site', homeUrl: 'https://example.com' }

    expect(getPowerpressPage(value, content)).toEqual(expected)
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
