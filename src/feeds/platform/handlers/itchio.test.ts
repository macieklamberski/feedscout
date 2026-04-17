import { describe, expect, it } from 'bun:test'
import { itchioHandler } from './itchio.js'

describe('itchioHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://itch.io/games', true],
      ['https://www.itch.io/games', true],
      ['https://leafo.itch.io', true],
      ['https://leafo.itch.io/x-moon', true],
      ['https://example.com', false],
      ['https://notitch.io', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(itchioHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(itchioHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return devlog feed for game page on subdomain', () => {
      const value = 'https://npckc.itch.io/a-tavern-for-tea'
      const expected = [
        {
          uri: 'https://npckc.itch.io/a-tavern-for-tea/devlog.rss',
          hint: { key: 'itchio:devlog', label: 'Devlog' },
        },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return devlog feed for game page with subpath', () => {
      const value = 'https://leafo.itch.io/x-moon/devlog'
      const expected = [
        {
          uri: 'https://leafo.itch.io/x-moon/devlog.rss',
          hint: { key: 'itchio:devlog', label: 'Devlog' },
        },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return games-by-creator feed for creator root', () => {
      const value = 'https://leafo.itch.io/'
      const expected = [
        {
          uri: 'https://itch.io/games/by-leafo.xml',
          hint: { key: 'itchio:games', label: 'Games' },
        },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return games-by-user feed for by-username path', () => {
      const value = 'https://itch.io/games/by-leafo'
      const expected = [
        {
          uri: 'https://itch.io/games/by-leafo.xml',
          hint: { key: 'itchio:games', label: 'Games' },
        },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag feed for tag path', () => {
      const value = 'https://itch.io/games/tag-horror'
      const expected = [
        {
          uri: 'https://itch.io/games/tag-horror.xml',
          hint: { key: 'itchio:tag', label: 'Tag' },
        },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return platform feed for platform path', () => {
      const value = 'https://itch.io/games/platform-web'
      const expected = [
        {
          uri: 'https://itch.io/games/platform-web.xml',
          hint: { key: 'itchio:platform', label: 'Platform' },
        },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return genre feed for genre path', () => {
      const value = 'https://itch.io/games/genre-puzzle'
      const expected = [
        {
          uri: 'https://itch.io/games/genre-puzzle.xml',
          hint: { key: 'itchio:genre', label: 'Genre' },
        },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return made-with feed for made-with path', () => {
      const value = 'https://itch.io/games/made-with-unity'
      const expected = [
        {
          uri: 'https://itch.io/games/made-with-unity.xml',
          hint: { key: 'itchio:made-with', label: 'Made with' },
        },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return sort feed for sort path', () => {
      const value = 'https://itch.io/games/newest'
      const expected = [
        {
          uri: 'https://itch.io/games/newest.xml',
          hint: { key: 'itchio:games', label: 'Games' },
        },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return sort feed for top-rated path', () => {
      const value = 'https://itch.io/games/top-rated'
      const expected = [
        {
          uri: 'https://itch.io/games/top-rated.xml',
          hint: { key: 'itchio:games', label: 'Games' },
        },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return games feed for /games path', () => {
      const value = 'https://itch.io/games'
      const expected = [
        { uri: 'https://itch.io/games.xml', hint: { key: 'itchio:games', label: 'Games' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return devlogs feed for /devlogs path', () => {
      const value = 'https://itch.io/devlogs'
      const expected = [
        { uri: 'https://itch.io/devlogs.xml', hint: { key: 'itchio:devlog', label: 'Devlog' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return section feed for tools path', () => {
      const value = 'https://itch.io/tools'
      const expected = [
        { uri: 'https://itch.io/tools.xml', hint: { key: 'itchio:section', label: 'Section' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return section feed for game-assets path', () => {
      const value = 'https://itch.io/game-assets'
      const expected = [
        {
          uri: 'https://itch.io/game-assets.xml',
          hint: { key: 'itchio:section', label: 'Section' },
        },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return section feed for soundtracks path', () => {
      const value = 'https://itch.io/soundtracks'
      const expected = [
        {
          uri: 'https://itch.io/soundtracks.xml',
          hint: { key: 'itchio:section', label: 'Section' },
        },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return curated feeds for root path', () => {
      const value = 'https://itch.io/'
      const expected = [
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })

    it('should return curated feeds for www subdomain root', () => {
      const value = 'https://www.itch.io/'
      const expected = [
        {
          uri: 'https://itch.io/feed/featured.xml',
          hint: { key: 'itchio:featured', label: 'Featured' },
        },
        { uri: 'https://itch.io/feed/new.xml', hint: { key: 'itchio:new', label: 'New' } },
        { uri: 'https://itch.io/feed/sales.xml', hint: { key: 'itchio:sales', label: 'Sales' } },
      ]

      expect(itchioHandler.resolve(value)).toEqual(expected)
    })
  })
})
