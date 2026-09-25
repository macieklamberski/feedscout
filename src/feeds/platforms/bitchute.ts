import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type BitchuteUrl = { kind: 'channel'; channel: string }

const hosts = ['bitchute.com', 'www.bitchute.com']

export const parseBitchuteUrl = (url: string): BitchuteUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [section, channel] = getPathSegments(url)

  if (section !== 'channel' || !channel) {
    return
  }

  return { kind: 'channel', channel }
}

export const bitchuteHandler: PlatformHandler = {
  match: (url) => {
    return parseBitchuteUrl(url) !== undefined
  },

  resolve: (url) => {
    const channel = parseBitchuteUrl(url)?.channel

    if (!channel) {
      return []
    }

    return [
      {
        uri: `https://www.bitchute.com/feeds/rss/channel/${channel}/`,
        hint: composeHint('bitchute:channel'),
      },
    ]
  },
}
