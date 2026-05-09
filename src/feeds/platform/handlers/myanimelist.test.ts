import { describe, expect, it } from 'bun:test'
import { myanimelistHandler } from './myanimelist.js'

const expectedFeeds = (user: string) => [
  {
    uri: `https://myanimelist.net/rss.php?type=rw&u=${user}`,
    hint: { key: 'myanimelist:anime', label: 'Anime list' },
  },
  {
    uri: `https://myanimelist.net/rss.php?type=rm&u=${user}`,
    hint: { key: 'myanimelist:manga', label: 'Manga list' },
  },
  {
    uri: `https://myanimelist.net/rss.php?type=rrw&u=${user}`,
    hint: { key: 'myanimelist:recently-watched', label: 'Recently watched' },
  },
  {
    uri: `https://myanimelist.net/rss.php?type=rrm&u=${user}`,
    hint: { key: 'myanimelist:recently-read', label: 'Recently read' },
  },
]

describe('myanimelistHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://myanimelist.net/profile/Xinil', true],
      ['https://www.myanimelist.net/animelist/Xinil', true],
      ['https://myanimelist.net', true],
      ['https://example.com', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(myanimelistHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(myanimelistHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return all four feeds for /profile/{user}', () => {
      const value = 'https://myanimelist.net/profile/Xinil'
      const expected = expectedFeeds('Xinil')

      expect(myanimelistHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for /animelist/{user}', () => {
      const value = 'https://myanimelist.net/animelist/Xinil'
      const expected = expectedFeeds('Xinil')

      expect(myanimelistHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for /mangalist/{user}', () => {
      const value = 'https://myanimelist.net/mangalist/Xinil'
      const expected = expectedFeeds('Xinil')

      expect(myanimelistHandler.resolve(value)).toEqual(expected)
    })

    it('should return feeds for /history/{user}', () => {
      const value = 'https://myanimelist.net/history/Xinil'
      const expected = expectedFeeds('Xinil')

      expect(myanimelistHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for non-user paths', () => {
      expect(myanimelistHandler.resolve('https://myanimelist.net/anime/1')).toEqual([])
    })

    it('should return empty array for root', () => {
      expect(myanimelistHandler.resolve('https://myanimelist.net/')).toEqual([])
    })
  })
})
