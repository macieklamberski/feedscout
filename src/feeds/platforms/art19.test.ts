import { describe, expect, it } from 'bun:test'
import { type Art19Url, art19Handler, parseArt19Url } from './art19.js'

describe('parseArt19Url', () => {
  it('should return the show for a show page', () => {
    const expected: Art19Url = { kind: 'show', slug: 'my-show' }

    expect(parseArt19Url('https://art19.com/shows/my-show')).toEqual(expected)
  })

  it('should return the show for a show page with a capitalized shows segment', () => {
    const expected: Art19Url = { kind: 'show', slug: 'my-show' }

    expect(parseArt19Url('https://www.art19.com/Shows/my-show')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseArt19Url('https://art19.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseArt19Url('https://example.com/shows/my-show')).toBeUndefined()
  })
})

describe('art19Handler', () => {
  describe('match', () => {
    it('should match a show page', () => {
      expect(art19Handler.match('https://art19.com/shows/example-show')).toBe(true)
      expect(art19Handler.match('https://www.art19.com/shows/example-show')).toBe(true)
    })

    it('should match a show page with a capitalized shows segment', () => {
      expect(art19Handler.match('https://art19.com/Shows/example-show')).toBe(true)
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
    it('should return empty array for a URL outside the platform', () => {
      expect(art19Handler.resolve('https://example.com/')).toEqual([])
    })

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
  })
})
