import { steam } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: daily-deals, group, group-news, new-releases, news, news-collection, weekly-top-sellers.

export type SteamUrl =
  | { kind: 'app'; appId: string }
  | { kind: 'group'; group: string }
  | { kind: 'groupNews'; clanId: string }
  | { kind: 'collection'; collection: string }
  | { kind: 'news' }

const storeHosts = ['store.steampowered.com']
const communityHosts = ['steamcommunity.com']
const hosts = [...storeHosts, ...communityHosts]

// An age-gated store page redirects to /agecheck/app/{id}.
const appRegex = /^\/(?:agecheck\/|news(?:hub)?\/)?app\/(\d+)(?:\/|$)/i
const groupRegex = /^\/groups\/([^/]+)/i
const groupNewsRegex = /^\/news\/group\/(\d+)(?:\/|$)/i
const collectionRegex = /^\/news\/collection\/([^/]+)/i
// The store front links to `/newshub/`, which redirects to `/news/`.
const newsRegex = /^\/news(?:hub)?(?:\/|$)/i

const feeds = withHintLabels(steam.feeds)

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

  if (isHostOf(parsedUrl, storeHosts)) {
    const clanId = pathname.match(groupNewsRegex)?.[1]

    if (clanId) {
      return { kind: 'groupNews', clanId }
    }

    const collection = pathname.match(collectionRegex)?.[1]

    if (collection) {
      return { kind: 'collection', collection }
    }
  }

  // The store front and its news hub get the store-wide listings.
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

    // The store's deals, releases and top sellers need no value from the page, so every store page
    // builds them after its own feeds. A community page is another site.
    if (parsed.kind === 'app') {
      return [
        feeds.getFeedEntry('news', { appId: parsed.appId }),
        feeds.getFeedEntry('community-news', { game: parsed.appId }),
        ...(isHostOf(url, storeHosts)
          ? [
              feeds.getFeedEntry('daily-deals'),
              feeds.getFeedEntry('new-releases'),
              feeds.getFeedEntry('weekly-top-sellers'),
            ]
          : []),
      ]
    }

    if (parsed.kind === 'group') {
      return [feeds.getFeedEntry('group', { group: parsed.group })]
    }

    if (parsed.kind === 'groupNews') {
      return [
        feeds.getFeedEntry('group-news', { clanId: parsed.clanId }),
        feeds.getFeedEntry('daily-deals'),
        feeds.getFeedEntry('new-releases'),
        feeds.getFeedEntry('weekly-top-sellers'),
      ]
    }

    if (parsed.kind === 'collection') {
      return [
        feeds.getFeedEntry('news-collection', { collection: parsed.collection }),
        feeds.getFeedEntry('daily-deals'),
        feeds.getFeedEntry('new-releases'),
        feeds.getFeedEntry('weekly-top-sellers'),
      ]
    }

    return [
      feeds.getFeedEntry('daily-deals'),
      feeds.getFeedEntry('new-releases'),
      feeds.getFeedEntry('weekly-top-sellers'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
