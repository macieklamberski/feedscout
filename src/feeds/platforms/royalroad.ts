import { royalroad } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type RoyalroadUrl = { kind: 'fiction'; fictionId: string }

const hosts = royalroad.hosts.exact

// A chapter URL sits under its fiction, so it carries the fiction id too.
const fictionIdRegex = /^\/fiction\/(\d+)(?:\/|$)/i

const feeds = withHintLabels(royalroad.feeds)

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

    return [feeds.getFeedEntry('fiction', { fictionId: parsed.fictionId })]
  },

  getFeedHint: feeds.getFeedHint,
}
