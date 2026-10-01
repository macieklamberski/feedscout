import { describe, expect, it } from 'bun:test'
import { type AcastUrl, acastHandler, parseAcastUrl } from './acast.js'

describe('parseAcastUrl', () => {
  it('should return the show for a show page', () => {
    const expected: AcastUrl = { kind: 'show', slug: 'my-show' }

    expect(parseAcastUrl('https://shows.acast.com/my-show')).toEqual(expected)
  })

  it('should return the show for a legacy play page', () => {
    const expected: AcastUrl = { kind: 'show', slug: 'my-show' }

    expect(parseAcastUrl('https://play.acast.com/s/my-show')).toEqual(expected)
  })

  it('should return the show for an embed page', () => {
    const expected: AcastUrl = { kind: 'show', slug: 'my-show' }

    expect(parseAcastUrl('https://embed.acast.com/my-show')).toEqual(expected)
  })

  it('should return undefined for an excluded path', () => {
    expect(parseAcastUrl('https://shows.acast.com/discover')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseAcastUrl('https://shows.acast.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseAcastUrl('https://example.com/my-show')).toBeUndefined()
  })
})

describe('acastHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://shows.acast.com/my-dad-wrote-a-porno'],
      [false, 'https://shows.acast.com'],
      [true, 'https://play.acast.com/s/my-dad-wrote-a-porno'],
      [true, 'https://embed.acast.com/my-dad-wrote-a-porno'],
      [false, 'https://acast.com/show'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(acastHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(acastHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(acastHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return podcast feed for show', () => {
      const value = 'https://shows.acast.com/my-dad-wrote-a-porno'
      const expected = [
        {
          uri: 'https://feeds.acast.com/public/shows/my-dad-wrote-a-porno',
          hint: { key: 'acast:podcast', label: 'Podcast' },
        },
      ]

      expect(acastHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://shows.acast.com/my-dad-wrote-a-porno/some-episode'
      const expected = [
        {
          uri: 'https://feeds.acast.com/public/shows/my-dad-wrote-a-porno',
          hint: { key: 'acast:podcast', label: 'Podcast' },
        },
      ]

      expect(acastHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://shows.acast.com/'

      expect(acastHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://shows.acast.com/discover'

      expect(acastHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for a capitalized excluded path', () => {
      const value = 'https://shows.acast.com/Discover'

      expect(acastHandler.resolve(value)).toEqual([])
    })

    it('should return podcast feed for play.acast.com/s/{slug}', () => {
      const value = 'https://play.acast.com/s/my-dad-wrote-a-porno'
      const expected = [
        {
          uri: 'https://feeds.acast.com/public/shows/my-dad-wrote-a-porno',
          hint: { key: 'acast:podcast', label: 'Podcast' },
        },
      ]

      expect(acastHandler.resolve(value)).toEqual(expected)
    })

    it('should return podcast feed for embed.acast.com/{slug}', () => {
      const value = 'https://embed.acast.com/my-dad-wrote-a-porno'
      const expected = [
        {
          uri: 'https://feeds.acast.com/public/shows/my-dad-wrote-a-porno',
          hint: { key: 'acast:podcast', label: 'Podcast' },
        },
      ]

      expect(acastHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for play.acast.com/s without slug', () => {
      const value = 'https://play.acast.com/s'

      expect(acastHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded path on embed.acast.com', () => {
      const value = 'https://embed.acast.com/discover'

      expect(acastHandler.resolve(value)).toEqual([])
    })
  })
})
