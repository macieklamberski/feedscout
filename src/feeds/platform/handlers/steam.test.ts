import { describe, expect, it } from 'bun:test'
import { steamHandler } from './steam.js'

describe('steamHandler', () => {
  describe('match', () => {
    const cases = [
      ['https://store.steampowered.com/app/730/Counter_Strike_2/', true],
      ['https://store.steampowered.com/news/app/730/', true],
      ['https://steamcommunity.com/app/730', true],
      ['https://steamcommunity.com/groups/Valve', true],
      ['https://example.com/app/730', false],
    ] as const

    it.each(cases)('%s -> %s', (url, expected) => {
      expect(steamHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(steamHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return news feed for store app page', () => {
      const value = 'https://store.steampowered.com/app/730/Counter_Strike_2/'
      const expected = [
        {
          uri: 'https://store.steampowered.com/feeds/news/app/730/',
          hint: { key: 'steam:news', label: 'News' },
        },
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return news feed for store app page without slug', () => {
      const value = 'https://store.steampowered.com/app/730'
      const expected = [
        {
          uri: 'https://store.steampowered.com/feeds/news/app/730/',
          hint: { key: 'steam:news', label: 'News' },
        },
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return news feed for store news page', () => {
      const value = 'https://store.steampowered.com/news/app/730/'
      const expected = [
        {
          uri: 'https://store.steampowered.com/feeds/news/app/730/',
          hint: { key: 'steam:news', label: 'News' },
        },
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return news feed for community app page', () => {
      const value = 'https://steamcommunity.com/app/730'
      const expected = [
        {
          uri: 'https://store.steampowered.com/feeds/news/app/730/',
          hint: { key: 'steam:news', label: 'News' },
        },
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return group RSS feed for community group page', () => {
      const value = 'https://steamcommunity.com/groups/Valve'
      const expected = [
        {
          uri: 'https://steamcommunity.com/groups/Valve/rss',
          hint: { key: 'steam:group', label: 'Group' },
        },
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return group RSS feed for community group with trailing slash', () => {
      const value = 'https://steamcommunity.com/groups/Valve/'
      const expected = [
        {
          uri: 'https://steamcommunity.com/groups/Valve/rss',
          hint: { key: 'steam:group', label: 'Group' },
        },
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return global news feed for store homepage', () => {
      const value = 'https://store.steampowered.com/'
      const expected = [
        {
          uri: 'https://store.steampowered.com/feeds/news.xml',
          hint: { key: 'steam:news-global', label: 'News (global)' },
        },
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return global news feed for store news index', () => {
      const value = 'https://store.steampowered.com/news/'
      const expected = [
        {
          uri: 'https://store.steampowered.com/feeds/news.xml',
          hint: { key: 'steam:news-global', label: 'News (global)' },
        },
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for community homepage', () => {
      expect(steamHandler.resolve('https://steamcommunity.com/')).toEqual([])
    })

    it('should return empty array for unrecognized store path', () => {
      expect(steamHandler.resolve('https://store.steampowered.com/about/')).toEqual([])
    })
  })
})
