import { bitchute } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: channel.

export type BitchuteUrl = { kind: 'channel'; channel: string }

const feeds = withHintLabels(bitchute.feeds)

export const parseBitchuteUrl = (url: string): BitchuteUrl | undefined => {
  const page = bitchute.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'channel', channel: page.params.channel }
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

    return [feeds.getFeedEntry('channel', { channel: parsed.channel })]
  },

  getFeedHint: feeds.getFeedHint,
}
