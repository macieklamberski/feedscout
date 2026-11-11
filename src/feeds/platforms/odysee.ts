import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hexRegex } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type OdyseeUrl = { kind: 'channel'; name: string; claimId?: string }

export const hosts = ['odysee.com', 'www.odysee.com']

const channelRegex = /^\/@(?<name>[^/:]+)(?::(?<claimId>[^/]+))?/

const feeds = definePlatformFeeds([
  { key: 'odysee:videos', template: 'https://odysee.com/$/rss/@{name}:{claimId}' },
])

export const parseOdyseeUrl = (url: string): OdyseeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  // Odysee's share code percent-encodes the path, `@` and `:` included.
  const pathname = decodeSegment(parsedUrl.pathname)
  const groups = pathname?.match(channelRegex)?.groups

  if (!groups?.name) {
    return
  }

  const { name, claimId } = groups

  if (claimId !== undefined && !hexRegex.test(claimId)) {
    return
  }

  return { kind: 'channel', name, claimId }
}

export const odyseeHandler: PlatformHandler = {
  // The feed answers "Invalid URL" for a channel without its claim ID.
  match: (url) => {
    return parseOdyseeUrl(url)?.claimId !== undefined
  },

  resolve: (url) => {
    const parsed = parseOdyseeUrl(url)

    if (!parsed?.claimId) {
      return []
    }

    return [feeds.getFeedEntry('odysee:videos', { name: parsed.name, claimId: parsed.claimId })]
  },

  getFeedKey: feeds.getFeedKey,
}
