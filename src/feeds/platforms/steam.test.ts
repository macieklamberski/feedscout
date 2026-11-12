import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { SteamUrl } from './steam.js'
import { parseSteamUrl, steamHandler } from './steam.js'

const newsHint: DiscoverUriHint = { key: 'steam:news', label: 'News' }
const groupHint: DiscoverUriHint = { key: 'steam:group', label: 'Group' }
const communityNewsHint: DiscoverUriHint = { key: 'steam:community-news', label: 'Community news' }
const groupNewsHint: DiscoverUriHint = { key: 'steam:group-news', label: 'Group news' }
const collectionHint: DiscoverUriHint = { key: 'steam:news-collection', label: 'News collection' }
const newReleasesHint: DiscoverUriHint = { key: 'steam:new-releases', label: 'New releases' }
const topSellersHint: DiscoverUriHint = {
  key: 'steam:weekly-top-sellers',
  label: 'Weekly top sellers',
}
const globalEntries: Array<DiscoverUriEntry> = [
  {
    uri: 'https://store.steampowered.com/feeds/news.xml',
    hint: { key: 'steam:news-global', label: 'News (global)' },
  },
  {
    uri: 'https://store.steampowered.com/feeds/daily_deals.xml',
    hint: { key: 'steam:daily-deals', label: 'Daily deals' },
  },
  { uri: 'https://store.steampowered.com/feeds/newreleases.xml', hint: newReleasesHint },
  { uri: 'https://store.steampowered.com/feeds/weeklytopsellers.xml', hint: topSellersHint },
]
const feedCases: Array<[string, DiscoverUriHint]> = [
  ['https://store.steampowered.com/feeds/news/app/12345/', newsHint],
  ['https://store.steampowered.com/feeds/news/app/12345', newsHint],
  ['https://store.steampowered.com/feeds/news/app/12345/?snr=1_2108_9__2107', newsHint],
  ['https://store.steampowered.com/feeds/news/app/12345/Example_Game', newsHint],
  ['https://store.steampowered.com/feeds/newshub/app/12345?cc=FR&l=french', newsHint],
  ['https://steamcommunity.com/games/12345/rss', communityNewsHint],
  ['https://steamcommunity.com/games/12345/rss/', communityNewsHint],
  ['https://steamcommunity.com/games/ExampleGame/rss', communityNewsHint],
  ['https://store.steampowered.com/feeds/news/group/12345', groupNewsHint],
  ['https://store.steampowered.com/feeds/news/group/12345?cc=HK&l=schinese', groupNewsHint],
  ['https://store.steampowered.com/feeds/news/collection/steam', collectionHint],
  ['https://store.steampowered.com/feeds/news/collection/steam?cc=HK&l=schinese', collectionHint],
  ['https://store.steampowered.com/feeds/newreleases.xml', newReleasesHint],
  [
    'https://store.steampowered.com/feeds/weeklytopsellers.xml?utm_campaign=link&utm_medium=organic',
    topSellersHint,
  ],
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
      const expected = [
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
      const expected = globalEntries

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return global store feeds for store news index', () => {
      const value = 'https://store.steampowered.com/news/'
      const expected = globalEntries

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return global store feeds for a capitalized store news index', () => {
      const value = 'https://store.steampowered.com/News/'
      const expected = globalEntries

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return global store feeds for the store news hub link', () => {
      const value = 'https://store.steampowered.com/newshub/'
      const expected = globalEntries

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return the group news feed for a store group news page', () => {
      const value = 'https://store.steampowered.com/news/group/12345/'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://store.steampowered.com/feeds/news/group/12345', hint: groupNewsHint },
      ]

      expect(steamHandler.resolve(value)).toEqual(expected)
    })

    it('should return the collection feed for a store news collection page', () => {
      const value = 'https://store.steampowered.com/news/collection/steam'
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://store.steampowered.com/feeds/news/collection/steam', hint: collectionHint },
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
    it('should return the news hint for an app news feed', () => {
      const value = 'https://store.steampowered.com/feeds/news/app/12345/'
      const expected: DiscoverUriHint = { key: 'steam:news', label: 'News' }

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the news hint for an app news feed with the app name', () => {
      const value = 'https://store.steampowered.com/feeds/news/app/12345/Example_Game'
      const expected: DiscoverUriHint = { key: 'steam:news', label: 'News' }

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the news hint for an app news hub feed', () => {
      const value = 'https://store.steampowered.com/feeds/newshub/app/12345'
      const expected: DiscoverUriHint = { key: 'steam:news', label: 'News' }

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the community news hint for a community game feed', () => {
      const value = 'https://steamcommunity.com/games/12345/rss'
      const expected = communityNewsHint

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the community news hint for a community game feed by name', () => {
      const value = 'https://steamcommunity.com/games/ExampleGame/rss'
      const expected = communityNewsHint

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group hint for a group feed', () => {
      const value = 'https://steamcommunity.com/groups/alice/rss'
      const expected: DiscoverUriHint = { key: 'steam:group', label: 'Group' }

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the global news hint for the global news feed', () => {
      const value = 'https://store.steampowered.com/feeds/news.xml'
      const expected: DiscoverUriHint = { key: 'steam:news-global', label: 'News (global)' }

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the daily deals hint for the daily deals feed', () => {
      const value = 'https://store.steampowered.com/feeds/daily_deals.xml'
      const expected: DiscoverUriHint = { key: 'steam:daily-deals', label: 'Daily deals' }

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group news hint for a group news feed', () => {
      const value = 'https://store.steampowered.com/feeds/news/group/12345'
      const expected = groupNewsHint

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the collection hint for a news collection feed', () => {
      const value = 'https://store.steampowered.com/feeds/news/collection/steam'
      const expected = collectionHint

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the new releases hint for the new releases feed', () => {
      const value = 'https://store.steampowered.com/feeds/newreleases.xml'
      const expected = newReleasesHint

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the weekly top sellers hint for the weekly top sellers feed', () => {
      const value = 'https://store.steampowered.com/feeds/weeklytopsellers.xml'
      const expected = topSellersHint

      expect(steamHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a word in place of the app id', () => {
      const value = 'https://store.steampowered.com/feeds/news/app/example/'

      expect(steamHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a word in place of the clan id', () => {
      const value = 'https://store.steampowered.com/feeds/news/group/example'

      expect(steamHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a word in place of the news hub app id', () => {
      const value = 'https://store.steampowered.com/feeds/newshub/app/example'

      expect(steamHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a word in place of the app id on a www store host', () => {
      const value = 'https://www.store.steampowered.com/feeds/news/app/example/'

      expect(steamHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an app page', () => {
      const value = 'https://store.steampowered.com/app/12345/'

      expect(steamHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a group page', () => {
      const value = 'https://steamcommunity.com/groups/alice'

      expect(steamHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/feeds/news/app/12345/'

      expect(steamHandler.getFeedHint?.(value)).toBeUndefined()
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
