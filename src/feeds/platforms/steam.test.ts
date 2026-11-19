import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { SteamUrl } from './steam.js'
import { parseSteamUrl, steamHandler } from './steam.js'

const newsHint: DiscoverUriHint = { key: 'steam:news', label: 'News' }
const groupNewsHint: DiscoverUriHint = { key: 'steam:group-news', label: 'Group news' }
const collectionHint: DiscoverUriHint = { key: 'steam:news-collection', label: 'News collection' }
const newReleasesHint: DiscoverUriHint = { key: 'steam:new-releases', label: 'New releases' }
const topSellersHint: DiscoverUriHint = {
  key: 'steam:weekly-top-sellers',
  label: 'Weekly top sellers',
}
const storeEntries: Array<DiscoverUriEntry> = [
  {
    uri: 'https://store.steampowered.com/feeds/daily_deals.xml',
    hint: { key: 'steam:daily-deals', label: 'Daily deals' },
  },
  { uri: 'https://store.steampowered.com/feeds/newreleases.xml', hint: newReleasesHint },
  { uri: 'https://store.steampowered.com/feeds/weeklytopsellers.xml', hint: topSellersHint },
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

  it('should return the clan for a store group news page', () => {
    const value = 'https://store.steampowered.com/news/group/12345'
    const expected: SteamUrl = { kind: 'groupNews', clanId: '12345' }

    expect(parseSteamUrl(value)).toEqual(expected)
  })

  it('should return the collection for a store news collection page', () => {
    const value = 'https://store.steampowered.com/news/collection/steam/'
    const expected: SteamUrl = { kind: 'collection', collection: 'steam' }

    expect(parseSteamUrl(value)).toEqual(expected)
  })

  it('should return the news for a store group news page without a numeric id', () => {
    const value = 'https://store.steampowered.com/news/group/example'
    const expected: SteamUrl = { kind: 'news' }

    expect(parseSteamUrl(value)).toEqual(expected)
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
    it('should return news and community news feeds for store app page', () => {
      const value = 'https://store.steampowered.com/app/730/Counter_Strike_2/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://store.steampowered.com/feeds/news/app/730/',
          hint: { key: 'steam:news', label: 'News' },
        },
        {
          uri: 'https://steamcommunity.com/games/730/rss',
          hint: { key: 'steam:community-news', label: 'Community news' },
        },
        ...storeEntries,
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return news and community news feeds without the store feeds for a community app page', () => {
      const value = 'https://steamcommunity.com/app/730'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://store.steampowered.com/feeds/news/app/730/',
          hint: { key: 'steam:news', label: 'News' },
        },
        {
          uri: 'https://steamcommunity.com/games/730/rss',
          hint: { key: 'steam:community-news', label: 'Community news' },
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

    it('should return global store feeds for store homepage', () => {
      const value = 'https://store.steampowered.com/'
      const expected = storeEntries

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return global store feeds for store news index', () => {
      const value = 'https://store.steampowered.com/news/'
      const expected = storeEntries

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return global store feeds for a capitalized store news index', () => {
      const value = 'https://store.steampowered.com/News/'
      const expected = storeEntries

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return global store feeds for the store news hub link', () => {
      const value = 'https://store.steampowered.com/newshub/'
      const expected = storeEntries

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return the group news feed for a store group news page', () => {
      const value = 'https://store.steampowered.com/news/group/12345/'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://store.steampowered.com/feeds/news/group/12345', hint: groupNewsHint },
        ...storeEntries,
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return the collection feed for a store news collection page', () => {
      const value = 'https://store.steampowered.com/news/collection/steam'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://store.steampowered.com/feeds/news/collection/steam', hint: collectionHint },
        ...storeEntries,
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

  describe('getFeedHint', () => {
    it('should return the news hint for an app news hub feed', () => {
      const value = 'https://store.steampowered.com/feeds/newshub/app/12345'
      const expected: DiscoverUriHint = { key: 'steam:news', label: 'News' }

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('as a feed URL input', () => {
    it('should return an app news hub feed as given', async () => {
      const value = 'https://store.steampowered.com/feeds/newshub/app/12345?cc=FR&l=french'
      const options = {
        ...defaultPlatformOptions,
        handlers: [steamHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint: newsHint }]

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
