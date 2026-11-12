import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type BitchuteUrl = { kind: 'channel'; channel: string }

const hosts = ['bitchute.com', 'www.bitchute.com']

const feeds = definePlatformFeeds([
  { key: 'bitchute:channel', template: 'https://www.bitchute.com/feeds/rss/channel/{channel}/' },
])

export const parseBitchuteUrl = (url: string): BitchuteUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [section, channel] = getPathSegments(url)

  if (!isAnyOf(section, 'channel') || !channel) {
    return
  }

  return { kind: 'channel', channel }
}

export const bitchuteHandler: PlatformHandler = {
  match: (url) => {
    return parseBitchuteUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBitchuteUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('bitchute:channel', { channel: parsed.channel })]
  },

  getFeedKey: feeds.getFeedKey,
}
