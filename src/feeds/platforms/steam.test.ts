import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { SteamUrl } from './steam.js'
import { parseSteamUrl, steamHandler } from './steam.js'

const newsHint: DiscoverUriHint = { key: 'steam:news', label: 'News' }
const groupHint: DiscoverUriHint = { key: 'steam:group', label: 'Group' }
const feedCases: Array<[string, DiscoverUriHint]> = [
  ['https://store.steampowered.com/feeds/news/app/12345/', newsHint],
  ['https://store.steampowered.com/feeds/news/app/12345', newsHint],
  ['https://store.steampowered.com/feeds/news/app/12345/?snr=1_2108_9__2107', newsHint],
  ['https://store.steampowered.com/feeds/news/app/12345/Example_Game', newsHint],
  ['https://store.steampowered.com/feeds/newshub/app/12345?cc=FR&l=french', newsHint],
  ['https://steamcommunity.com/games/12345/rss', newsHint],
  ['https://steamcommunity.com/games/12345/rss/', newsHint],
  ['https://steamcommunity.com/groups/alice/rss', groupHint],
  ['https://steamcommunity.com/groups/alice/rss/', groupHint],
  ['http://steamcommunity.com/groups/alice/rss', groupHint],
  [
    'https://store.steampowered.com/feeds/news.xml',
    { key: 'steam:news-global', label: 'News (global)' },
  ],
  [
    'https://store.steampowered.com/feeds/daily_deals.xml',
    { key: 'steam:daily-deals', label: 'Daily deals' },
  ],
]

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

  it('should return the group for a community group page with a capitalized groups segment', () => {
    const expected: SteamUrl = { kind: 'group', group: 'Valve' }

    expect(parseSteamUrl('https://steamcommunity.com/Groups/Valve/')).toEqual(expected)
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

  it('should return the news for the store homepage', () => {
    const expected: SteamUrl = { kind: 'news' }

    expect(parseSteamUrl('https://store.steampowered.com/')).toEqual(expected)
  })

  it('should return the news for the news hub', () => {
    const expected: SteamUrl = { kind: 'news' }

    expect(parseSteamUrl('https://store.steampowered.com/newshub/')).toEqual(expected)
  })

  it('should return undefined for the community homepage', () => {
    expect(parseSteamUrl('https://steamcommunity.com/')).toBeUndefined()
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

  describe('getFeedKey', () => {
    it('should return the news key for an app news feed', () => {
      const value = 'https://store.steampowered.com/feeds/news/app/12345/'
      const expected = 'steam:news'

      expect(steamHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the news key for an app news feed with the app name', () => {
      const value = 'https://store.steampowered.com/feeds/news/app/12345/Example_Game'
      const expected = 'steam:news'

      expect(steamHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the news key for an app news hub feed', () => {
      const value = 'https://store.steampowered.com/feeds/newshub/app/12345'
      const expected = 'steam:news'

      expect(steamHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the news key for a community game feed', () => {
      const value = 'https://steamcommunity.com/games/12345/rss'
      const expected = 'steam:news'

      expect(steamHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the news key for a community game feed by name', () => {
      const value = 'https://steamcommunity.com/games/ExampleGame/rss'
      const expected = 'steam:news'

      expect(steamHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the group key for a group feed', () => {
      const value = 'https://steamcommunity.com/groups/alice/rss'
      const expected = 'steam:group'

      expect(steamHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the global news key for the global news feed', () => {
      const value = 'https://store.steampowered.com/feeds/news.xml'
      const expected = 'steam:news-global'

      expect(steamHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the daily deals key for the daily deals feed', () => {
      const value = 'https://store.steampowered.com/feeds/daily_deals.xml'
      const expected = 'steam:daily-deals'

      expect(steamHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a word in place of the app id', () => {
      const value = 'https://store.steampowered.com/feeds/news/app/example/'

      expect(steamHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a word in place of the news hub app id', () => {
      const value = 'https://store.steampowered.com/feeds/newshub/app/example'

      expect(steamHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for an app page', () => {
      const value = 'https://store.steampowered.com/app/12345/'

      expect(steamHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a group page', () => {
      const value = 'https://steamcommunity.com/groups/alice'

      expect(steamHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/feeds/news/app/12345/'

      expect(steamHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('as a feed URL input', () => {
    it.each(feedCases)('should return %s as given', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [steamHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })

    it('should return nothing for a word in place of the app id', async () => {
      const value = 'https://store.steampowered.com/feeds/news/app/example/'
      const options = {
        ...defaultPlatformOptions,
        handlers: [steamHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = []

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
