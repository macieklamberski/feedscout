import { steam } from 'feedintel'
import { isHostOf } from 'trousse'
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

const feeds = withHintLabels(steam.feeds)

export const parseSteamUrl = (url: string): SteamUrl | undefined => {
  const page = steam.pages.read(url)

  if (!page) {
    return
  }

  const { appId, group, clanId, collection } = page.params

  if (page.key === 'app') {
    return { kind: 'app', appId }
  }

  if (page.key === 'group') {
    return { kind: 'group', group }
  }

  if (page.key === 'groupNews') {
    return { kind: 'groupNews', clanId }
  }

  if (page.key === 'collection') {
    return { kind: 'collection', collection }
  }

  // The store front and its news hub get the store-wide listings.
  return { kind: 'news' }
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
