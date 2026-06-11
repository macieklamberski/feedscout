import { describe, expect, it } from 'bun:test'
import { myanimelistHandler } from './myanimelist.js'

describe('myanimelistHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://myanimelist.net/profile/Xinil'],
      [true, 'https://www.myanimelist.net/animelist/Xinil'],
      [true, 'https://myanimelist.net'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(myanimelistHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(myanimelistHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return all four feeds for /profile/{user}', () => {
      const value = 'https://myanimelist.net/profile/Xinil'
      const expected = [
        {
          uri: 'https://myanimelist.net/rss.php?type=rw&u=Xinil',
          hint: { key: 'myanimelist:anime', label: 'Anime list' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rm&u=Xinil',
          hint: { key: 'myanimelist:manga', label: 'Manga list' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rrw&u=Xinil',
          hint: { key: 'myanimelist:recently-watched', label: 'Recently watched' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rrm&u=Xinil',
          hint: { key: 'myanimelist:recently-read', label: 'Recently read' },
        },
      ]

      expect(myanimelistHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for /animelist/{user}', () => {
      const value = 'https://myanimelist.net/animelist/Xinil'
      const expected = [
        {
          uri: 'https://myanimelist.net/rss.php?type=rw&u=Xinil',
          hint: { key: 'myanimelist:anime', label: 'Anime list' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rm&u=Xinil',
          hint: { key: 'myanimelist:manga', label: 'Manga list' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rrw&u=Xinil',
          hint: { key: 'myanimelist:recently-watched', label: 'Recently watched' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rrm&u=Xinil',
          hint: { key: 'myanimelist:recently-read', label: 'Recently read' },
        },
      ]

      expect(myanimelistHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for /mangalist/{user}', () => {
      const value = 'https://myanimelist.net/mangalist/Xinil'
      const expected = [
        {
          uri: 'https://myanimelist.net/rss.php?type=rw&u=Xinil',
          hint: { key: 'myanimelist:anime', label: 'Anime list' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rm&u=Xinil',
          hint: { key: 'myanimelist:manga', label: 'Manga list' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rrw&u=Xinil',
          hint: { key: 'myanimelist:recently-watched', label: 'Recently watched' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rrm&u=Xinil',
          hint: { key: 'myanimelist:recently-read', label: 'Recently read' },
        },
      ]

      expect(myanimelistHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for /history/{user}', () => {
      const value = 'https://myanimelist.net/history/Xinil'
      const expected = [
        {
          uri: 'https://myanimelist.net/rss.php?type=rw&u=Xinil',
          hint: { key: 'myanimelist:anime', label: 'Anime list' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rm&u=Xinil',
          hint: { key: 'myanimelist:manga', label: 'Manga list' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rrw&u=Xinil',
          hint: { key: 'myanimelist:recently-watched', label: 'Recently watched' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rrm&u=Xinil',
          hint: { key: 'myanimelist:recently-read', label: 'Recently read' },
        },
      ]

      expect(myanimelistHandler.resolve(value)).toEqual(expected)
    })

    it('should return news feed for /news', () => {
      const value = 'https://myanimelist.net/news'
      const expected = [
        {
          uri: 'https://myanimelist.net/rss/news.xml',
          hint: { key: 'myanimelist:news', label: 'News' },
        },
      ]

      expect(myanimelistHandler.resolve(value)).toEqual(expected)
    })

    it('should return news feed for /news/{slug}', () => {
      const value = 'https://myanimelist.net/news/12345-some-anime-news'
      const expected = [
        {
          uri: 'https://myanimelist.net/rss/news.xml',
          hint: { key: 'myanimelist:news', label: 'News' },
        },
      ]

      expect(myanimelistHandler.resolve(value)).toEqual(expected)
    })

    it('should return featured feed for /featured', () => {
      const value = 'https://myanimelist.net/featured'
      const expected = [
        {
          uri: 'https://myanimelist.net/rss/featured.xml',
          hint: { key: 'myanimelist:featured', label: 'Featured' },
        },
      ]

      expect(myanimelistHandler.resolve(value)).toEqual(expected)
    })

    it('should return featured feed for /featured/{slug}', () => {
      const value = 'https://myanimelist.net/featured/12345-some-feature'
      const expected = [
        {
          uri: 'https://myanimelist.net/rss/featured.xml',
          hint: { key: 'myanimelist:featured', label: 'Featured' },
        },
      ]

      expect(myanimelistHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-user paths', () => {
      expect(myanimelistHandler.resolve('https://myanimelist.net/anime/1')).toEqual([])
    })

    it('should return empty array for root', () => {
      expect(myanimelistHandler.resolve('https://myanimelist.net/')).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
