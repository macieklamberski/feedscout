import { describe, expect, it } from 'bun:test'
import { art19Handler } from './art19.js'

describe('art19Handler', () => {
  describe('match', () => {
    it('should match a show page', () => {
      expect(art19Handler.match('https://art19.com/shows/example-show')).toBe(true)
      expect(art19Handler.match('https://www.art19.com/shows/example-show')).toBe(true)
    })

    it('should not match the site root', () => {
      expect(art19Handler.match('https://art19.com/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(art19Handler.match('https://example.com/shows/example-show')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(art19Handler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the show feed on the feed host', () => {
      const value = 'https://art19.com/shows/example-show'
      const expected = [
        { uri: 'https://rss.art19.com/example-show', hint: { key: 'art19:show', label: 'Show' } },
      ]

      expect(art19Handler.resolve(value)).toEqual(expected)
    })

    it('should use the slug from an episode page', () => {
      const value = 'https://art19.com/shows/example-show/episodes/abc123'
      const expected = [
        { uri: 'https://rss.art19.com/example-show', hint: { key: 'art19:show', label: 'Show' } },
      ]

      expect(art19Handler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the site root', () => {
      expect(art19Handler.resolve('https://art19.com/')).toEqual([])
    })

    it('should return an empty array for invalid URLs', () => {
      expect(art19Handler.resolve('not-a-url')).toEqual([])
    })
  })
})
