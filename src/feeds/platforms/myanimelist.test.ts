import { describe, expect, it } from 'bun:test'
import type { MyanimelistUrl } from './myanimelist.js'
import { myanimelistHandler, parseMyanimelistUrl } from './myanimelist.js'

describe('parseMyanimelistUrl', () => {
  it('should return the user for a profile page', () => {
    const expected: MyanimelistUrl = { kind: 'user', username: 'Xinil' }

    expect(parseMyanimelistUrl('https://myanimelist.net/profile/Xinil')).toEqual(expected)
  })

  it('should return the user for an anime list page', () => {
    const value = 'https://myanimelist.net/animelist/Xinil'
    const expected: MyanimelistUrl = { kind: 'user', username: 'Xinil' }

    expect(parseMyanimelistUrl(value)).toEqual(expected)
  })

  it('should return the user for a manga list page', () => {
    const value = 'https://myanimelist.net/mangalist/Xinil'
    const expected: MyanimelistUrl = { kind: 'user', username: 'Xinil' }

    expect(parseMyanimelistUrl(value)).toEqual(expected)
  })

  it('should return the user for a history page', () => {
    const expected: MyanimelistUrl = { kind: 'user', username: 'Xinil' }

    expect(parseMyanimelistUrl('https://myanimelist.net/history/Xinil')).toEqual(expected)
  })

  it('should return the user for a page below the profile', () => {
    const value = 'https://myanimelist.net/profile/Xinil/reviews'
    const expected: MyanimelistUrl = { kind: 'user', username: 'Xinil' }

    expect(parseMyanimelistUrl(value)).toEqual(expected)
  })

  it('should return the user for the www host', () => {
    const value = 'https://www.myanimelist.net/animelist/Xinil'
    const expected: MyanimelistUrl = { kind: 'user', username: 'Xinil' }

    expect(parseMyanimelistUrl(value)).toEqual(expected)
  })

  it('should return the user for a capitalized section', () => {
    const expected: MyanimelistUrl = { kind: 'user', username: 'Xinil' }

    expect(parseMyanimelistUrl('https://myanimelist.net/Profile/Xinil')).toEqual(expected)
  })

  it('should return undefined for the news page', () => {
    expect(parseMyanimelistUrl('https://myanimelist.net/news')).toBeUndefined()
  })

  it('should return undefined for an anime page', () => {
    const value = 'https://myanimelist.net/anime/1/Cowboy_Bebop'

    expect(parseMyanimelistUrl(value)).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseMyanimelistUrl('https://myanimelist.net/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseMyanimelistUrl('https://example.com/profile/Xinil')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseMyanimelistUrl('not-a-url')).toBeUndefined()
  })
})

describe('myanimelistHandler', () => {
  describe('match', () => {
    it('should match a myanimelist.net URL', () => {
      expect(myanimelistHandler.match('https://myanimelist.net/profile/Xinil')).toBe(true)
    })

    it('should not match another host', () => {
      expect(myanimelistHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return all five feeds for /profile/{user}', () => {
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
          uri: 'https://myanimelist.net/rss.php?type=rwe&u=Xinil',
          hint: { key: 'myanimelist:recently-watched', label: 'Recently watched' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rrm&u=Xinil',
          hint: { key: 'myanimelist:recently-read', label: 'Recently read' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=blog&u=Xinil',
          hint: { key: 'myanimelist:blog', label: 'Blog' },
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
          uri: 'https://myanimelist.net/rss.php?type=rwe&u=Xinil',
          hint: { key: 'myanimelist:recently-watched', label: 'Recently watched' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rrm&u=Xinil',
          hint: { key: 'myanimelist:recently-read', label: 'Recently read' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=blog&u=Xinil',
          hint: { key: 'myanimelist:blog', label: 'Blog' },
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
          uri: 'https://myanimelist.net/rss.php?type=rwe&u=Xinil',
          hint: { key: 'myanimelist:recently-watched', label: 'Recently watched' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rrm&u=Xinil',
          hint: { key: 'myanimelist:recently-read', label: 'Recently read' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=blog&u=Xinil',
          hint: { key: 'myanimelist:blog', label: 'Blog' },
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
          uri: 'https://myanimelist.net/rss.php?type=rwe&u=Xinil',
          hint: { key: 'myanimelist:recently-watched', label: 'Recently watched' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=rrm&u=Xinil',
          hint: { key: 'myanimelist:recently-read', label: 'Recently read' },
        },
        {
          uri: 'https://myanimelist.net/rss.php?type=blog&u=Xinil',
          hint: { key: 'myanimelist:blog', label: 'Blog' },
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

    it('should not return news feed for a path that starts with news', () => {
      expect(myanimelistHandler.resolve('https://myanimelist.net/newsletter')).toEqual([])
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

    it('should return empty array for root', () => {
      expect(myanimelistHandler.resolve('https://myanimelist.net/')).toEqual([])
    })
  })
})
