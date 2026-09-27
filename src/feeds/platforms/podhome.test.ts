import { describe, expect, it } from 'bun:test'
import { podhomeHandler } from './podhome.js'

const stylesheet = '<link rel="stylesheet" href="https://cdn.podhome.fm/servesite3.min.css">'
const feedLink = `
  <link
    type="application/rss+xml"
    rel="alternate"
    title="Example Show"
    href="https://serve.podhome.fm/rss/00000000-0000-4000-8000-000000000000"
  >
`

describe('podhomeHandler', () => {
  describe('match', () => {
    it('should match a show page on serve.podhome.fm', () => {
      const value = `${stylesheet}${feedLink}`

      expect(podhomeHandler.match('https://serve.podhome.fm/example-show', value)).toBe(true)
    })

    it('should match a show page on a custom domain', () => {
      const value = `${stylesheet}${feedLink}`

      expect(podhomeHandler.match('https://www.example.com/', value)).toBe(true)
    })

    it('should not match a feed link without the show site assets', () => {
      expect(podhomeHandler.match('https://www.example.com/', feedLink)).toBe(false)
    })

    it('should not match the show site assets without a feed link', () => {
      expect(podhomeHandler.match('https://www.example.com/', stylesheet)).toBe(false)
    })

    it('should not match an alternate link to another host', () => {
      const value = `${stylesheet}<link rel="alternate" href="https://example.com/rss/abc">`

      expect(podhomeHandler.match('https://www.example.com/', value)).toBe(false)
    })

    it('should not match an alternate link outside the feed path', () => {
      const value = `${stylesheet}<link rel="alternate" href="https://serve.podhome.fm/example-show">`

      expect(podhomeHandler.match('https://www.example.com/', value)).toBe(false)
    })

    it('should not match without content', () => {
      expect(podhomeHandler.match('https://serve.podhome.fm/example-show')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(podhomeHandler.match('not-a-url', `${stylesheet}${feedLink}`)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the show feed the page links', () => {
      const value = `${stylesheet}${feedLink}`
      const expected = [
        {
          uri: 'https://serve.podhome.fm/rss/00000000-0000-4000-8000-000000000000',
          hint: { key: 'podhome:podcast', label: 'Podcast' },
        },
      ]

      expect(
        podhomeHandler.resolve('https://serve.podhome.fm/episodepage/example-show/1', value),
      ).toEqual(expected)
    })
  })
})
