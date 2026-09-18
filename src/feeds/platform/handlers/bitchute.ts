import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// BitChute channel pages carry only an oEmbed `alternate` link, so discovery
// finds no feed. Channel RSS lives at `/feeds/rss/channel/{slug}/`, keyed by
// the vanity slug that also appears in the channel URL.

const hosts = ['bitchute.com', 'www.bitchute.com']

export const bitchuteHandler: PlatformHandler = {
  match: (url) => {
    try {
      const { pathname } = new URL(url)
      const segments = pathname.split('/').filter(Boolean)

      return isHostOf(url, hosts) && segments[0] === 'channel' && Boolean(segments[1])
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const segments = new URL(url).pathname.split('/').filter(Boolean)

      if (segments[0] !== 'channel' || !segments[1]) {
        return []
      }

      return [
        {
          uri: `https://www.bitchute.com/feeds/rss/channel/${segments[1]}/`,
          hint: composeHint('bitchute:channel'),
        },
      ]
    } catch {}

    return []
  },
}
