import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type RoyalroadUrl = { kind: 'fiction'; fictionId: string }

const hosts = ['royalroad.com', 'www.royalroad.com']

// A chapter URL sits under its fiction, so it carries the fiction id too.
const fictionIdRegex = /^\/fiction\/(\d+)(?:\/|$)/i

// The fiction page advertises /syndication/{id}. The chapter page links /fiction/syndication/{id},
// which serves the same feed.
const feeds = definePlatformFeeds([
  { key: 'royalroad:fiction', template: 'https://www.royalroad.com/syndication/{fictionId}' },
  {
    key: 'royalroad:fiction',
    template: 'https://www.royalroad.com/fiction/syndication/{fictionId}',
  },
])

export const parseRoyalroadUrl = (url: string): RoyalroadUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const fictionId = parsedUrl.pathname.match(fictionIdRegex)?.[1]

  if (!fictionId) {
    return
  }

  return { kind: 'fiction', fictionId }
}

export const royalroadHandler: PlatformHandler = {
  match: (url) => {
    return parseRoyalroadUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseRoyalroadUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('royalroad:fiction', { fictionId: parsed.fictionId })]
  },

  // A fiction id is digits, and /syndication/latest answers 404.
  getFeedKey: (url) => {
    const fictionId = getPathSegments(url).at(-1)

    if (!fictionId || !digitsRegex.test(fictionId)) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
