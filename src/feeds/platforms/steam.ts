import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type SteamUrl =
  | { kind: 'app'; appId: string }
  | { kind: 'group'; group: string }
  | { kind: 'news' }

const storeHosts = ['store.steampowered.com']
const communityHosts = ['steamcommunity.com']
const hosts = [...storeHosts, ...communityHosts]

// An age-gated store page redirects to /agecheck/app/{id}.
const appRegex = /^\/(?:agecheck\/|news(?:hub)?\/)?app\/(\d+)(?:\/|$)/i
const groupRegex = /^\/groups\/([^/]+)/i
// The store front links to `/newshub/`, which redirects to `/news/`.
const newsRegex = /^\/news(?:hub)?(?:\/|$)/i

// The app page links /feeds/news/app/{id}/. The news hub path and a trailing app name serve the
// same feed. The community /games/{id}/rss carries the same announcements under community links.
const feeds = definePlatformFeeds([
  { key: 'steam:news', template: 'https://store.steampowered.com/feeds/news/app/{appId}/' },
  {
    key: 'steam:news',
    template: 'https://store.steampowered.com/feeds/news/app/{appId}/{appName}',
  },
  { key: 'steam:news', template: 'https://store.steampowered.com/feeds/newshub/app/{appId}' },
  { key: 'steam:news', template: 'https://steamcommunity.com/games/{appId}/rss' },
  { key: 'steam:group', template: 'https://steamcommunity.com/groups/{group}/rss' },
  { key: 'steam:news-global', template: 'https://store.steampowered.com/feeds/news.xml' },
  { key: 'steam:daily-deals', template: 'https://store.steampowered.com/feeds/daily_deals.xml' },
])

export const parseSteamUrl = (url: string): SteamUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const appId = parsedUrl.pathname.match(appRegex)?.[1]

  if (appId) {
    return { kind: 'app', appId }
  }

  const group = parsedUrl.pathname.match(groupRegex)?.[1]

  if (group && isHostOf(parsedUrl, communityHosts)) {
    return { kind: 'group', group }
  }

  const { pathname } = parsedUrl

  // The store front and its news hub link the global news feed.
  if (isHostOf(parsedUrl, storeHosts) && (pathname === '/' || newsRegex.test(pathname))) {
    return { kind: 'news' }
  }
}

export const steamHandler: PlatformHandler = {
  match: (url) => {
    return parseSteamUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSteamUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'app') {
      return [feeds.getFeedEntry('steam:news', { appId: parsed.appId })]
    }

    if (parsed.kind === 'group') {
      return [feeds.getFeedEntry('steam:group', { group: parsed.group })]
    }

    return [feeds.getFeedEntry('steam:news-global'), feeds.getFeedEntry('steam:daily-deals')]
  },

  // A store app id is digits, and /feeds/news/app/{word}/ answers 404. The community feed also
  // takes a game's name, as /games/CSGO/rss.
  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)
    const [feedsSegment, , , appId] = getPathSegments(url)

    if (
      hint?.key === 'steam:news' &&
      isAnyOf(feedsSegment, 'feeds') &&
      !digitsRegex.test(appId ?? '')
    ) {
      return
    }

    return hint
  },
}
