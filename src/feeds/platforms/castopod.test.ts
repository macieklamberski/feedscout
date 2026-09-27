import { describe, expect, it } from 'bun:test'
import { castopodHandler } from './castopod.js'

const content = `
  <link
    rel="stylesheet"
    type="text/css"
    href="/themes/colors"
  />
`

describe('castopodHandler', () => {
  describe('match', () => {
    it('should match a podcast page carrying the theme colors stylesheet', () => {
      expect(castopodHandler.match('https://example.org/@podcast', content)).toBe(true)
    })

    it('should not match a podcast page without the stylesheet', () => {
      const value = '<link rel="stylesheet" href="/assets/styles/index.css">'

      expect(castopodHandler.match('https://example.org/@podcast', value)).toBe(false)
    })

    it('should not match without content', () => {
      expect(castopodHandler.match('https://example.org/@podcast')).toBe(false)
    })

    it('should not match the instance home page', () => {
      expect(castopodHandler.match('https://example.org/', content)).toBe(false)
    })

    it('should not match a remote actor', () => {
      const value = 'https://example.org/@alice@example.com'

      expect(castopodHandler.match(value, content)).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(castopodHandler.match('not-a-url', content)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the podcast feed for a podcast page', () => {
      const expected = [
        {
          uri: 'https://example.org/@podcast/feed.xml',
          hint: { key: 'castopod:podcast', label: 'Podcast' },
        },
      ]

      expect(castopodHandler.resolve('https://example.org/@podcast', content)).toEqual(expected)
    })

    it('should return the podcast feed for an episode page', () => {
      const value = 'https://example.org/@podcast/episodes/first-episode'
      const expected = [
        {
          uri: 'https://example.org/@podcast/feed.xml',
          hint: { key: 'castopod:podcast', label: 'Podcast' },
        },
      ]

      expect(castopodHandler.resolve(value, content)).toEqual(expected)
    })

    it('should decode a percent-encoded handle prefix', () => {
      const expected = [
        {
          uri: 'https://example.org/@podcast/feed.xml',
          hint: { key: 'castopod:podcast', label: 'Podcast' },
        },
      ]

      expect(castopodHandler.resolve('https://example.org/%40podcast', content)).toEqual(expected)
    })

    it('should build the feed from the install root the stylesheet names', () => {
      const value = 'https://example.org/podcasts/@podcast/episodes/first-episode'
      const subPathContent = '<link rel="stylesheet" href="/podcasts/themes/colors">'
      const expected = [
        {
          uri: 'https://example.org/podcasts/@podcast/feed.xml',
          hint: { key: 'castopod:podcast', label: 'Podcast' },
        },
      ]

      expect(castopodHandler.resolve(value, subPathContent)).toEqual(expected)
    })

    it('should return nothing without the stylesheet', () => {
      expect(castopodHandler.resolve('https://example.org/@podcast', '<html></html>')).toEqual([])
    })
  })
})
