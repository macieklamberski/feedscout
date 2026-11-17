import { bitchute } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type BitchuteUrl = { kind: 'channel'; channel: string }

const hosts = bitchute.hosts.exact

const feeds = withHintLabels(bitchute.feeds)

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

  getFeedHint: feeds.getFeedHint,
}
