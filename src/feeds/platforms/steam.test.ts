import { describe, expect, it } from 'bun:test'
import type { SteamUrl } from './steam.js'
import { parseSteamUrl, steamHandler } from './steam.js'

describe('parseSteamUrl', () => {
  it('should return the app for a store app page', () => {
    const expected: SteamUrl = { kind: 'app', appId: '730' }

    expect(parseSteamUrl('https://store.steampowered.com/app/730/Counter_Strike_2/')).toEqual(
      expected,
    )
  })

  it('should return the app for a store app page without a slug', () => {
    const expected: SteamUrl = { kind: 'app', appId: '730' }

    expect(parseSteamUrl('https://store.steampowered.com/app/730')).toEqual(expected)
  })

  it('should return the app for an age-gated store app page', () => {
    const expected: SteamUrl = { kind: 'app', appId: '730' }

    expect(parseSteamUrl('https://store.steampowered.com/agecheck/app/730/')).toEqual(expected)
  })

  it('should return the app for a store app news page', () => {
    const expected: SteamUrl = { kind: 'app', appId: '730' }

    expect(parseSteamUrl('https://store.steampowered.com/news/app/730')).toEqual(expected)
  })

  it('should return the app for a store app news hub page', () => {
    const expected: SteamUrl = { kind: 'app', appId: '730' }

    expect(parseSteamUrl('https://store.steampowered.com/newshub/app/730')).toEqual(expected)
  })

  it('should return the app for a store app news page with a capitalized app segment', () => {
    const expected: SteamUrl = { kind: 'app', appId: '730' }

    expect(parseSteamUrl('https://store.steampowered.com/news/App/730')).toEqual(expected)
  })

  it('should return the app for a community app page', () => {
    const expected: SteamUrl = { kind: 'app', appId: '730' }

    expect(parseSteamUrl('https://steamcommunity.com/app/730')).toEqual(expected)
  })

  it('should return the app for an uppercase host', () => {
    const expected: SteamUrl = { kind: 'app', appId: '730' }

    expect(parseSteamUrl('https://Store.SteamPowered.com/app/730')).toEqual(expected)
  })

  it('should return the group for a community group page', () => {
    const expected: SteamUrl = { kind: 'group', group: 'Valve' }

    expect(parseSteamUrl('https://steamcommunity.com/groups/Valve/')).toEqual(expected)
  })

  it('should return the group for a community group page without a trailing slash', () => {
    const expected: SteamUrl = { kind: 'group', group: 'Valve' }

    expect(parseSteamUrl('https://steamcommunity.com/groups/Valve')).toEqual(expected)
  })

  it('should return undefined for a group path on the store host', () => {
    expect(parseSteamUrl('https://store.steampowered.com/groups/Valve')).toBeUndefined()
  })

  it('should return undefined for an app path without a numeric id', () => {
    expect(parseSteamUrl('https://store.steampowered.com/app/portal')).toBeUndefined()
  })

  it('should return undefined for an app id followed by letters', () => {
    expect(parseSteamUrl('https://store.steampowered.com/app/620x')).toBeUndefined()
  })

  it('should return undefined for the store homepage', () => {
    expect(parseSteamUrl('https://store.steampowered.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseSteamUrl('https://example.com/app/730')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseSteamUrl('not-a-url')).toBeUndefined()
  })
})

describe('steamHandler', () => {
  describe('match', () => {
    it('should return true for a store page', () => {
      expect(steamHandler.match('https://store.steampowered.com/app/730/Counter_Strike_2/')).toBe(
        true,
      )
    })

    it('should return true for a community page', () => {
      expect(steamHandler.match('https://steamcommunity.com/app/730')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(steamHandler.match('https://example.com/app/730')).toBe(false)
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

    it('should return global news and daily deals feeds for store homepage', () => {
      const value = 'https://store.steampowered.com/'
      const expected = [
        {
          uri: 'https://store.steampowered.com/feeds/news.xml',
          hint: { key: 'steam:news-global', label: 'News (global)' },
        },
        {
          uri: 'https://store.steampowered.com/feeds/daily_deals.xml',
          hint: { key: 'steam:daily-deals', label: 'Daily deals' },
        },
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return global news and daily deals feeds for store news index', () => {
      const value = 'https://store.steampowered.com/news/'
      const expected = [
        {
          uri: 'https://store.steampowered.com/feeds/news.xml',
          hint: { key: 'steam:news-global', label: 'News (global)' },
        },
        {
          uri: 'https://store.steampowered.com/feeds/daily_deals.xml',
          hint: { key: 'steam:daily-deals', label: 'Daily deals' },
        },
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return global news and daily deals feeds for a capitalized store news index', () => {
      const value = 'https://store.steampowered.com/News/'
      const expected = [
        {
          uri: 'https://store.steampowered.com/feeds/news.xml',
          hint: { key: 'steam:news-global', label: 'News (global)' },
        },
        {
          uri: 'https://store.steampowered.com/feeds/daily_deals.xml',
          hint: { key: 'steam:daily-deals', label: 'Daily deals' },
        },
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return global news and daily deals feeds for the store news hub link', () => {
      const value = 'https://store.steampowered.com/newshub/'
      const expected = [
        {
          uri: 'https://store.steampowered.com/feeds/news.xml',
          hint: { key: 'steam:news-global', label: 'News (global)' },
        },
        {
          uri: 'https://store.steampowered.com/feeds/daily_deals.xml',
          hint: { key: 'steam:daily-deals', label: 'Daily deals' },
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
