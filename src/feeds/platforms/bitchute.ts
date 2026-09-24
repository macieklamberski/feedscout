import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export const hosts = ['bitchute.com', 'www.bitchute.com']

export const bitchuteHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const { pathname } = parsedUrl
    const segments = pathname.split('/').filter(Boolean)

    return isHostOf(url, hosts) && segments[0] === 'channel' && Boolean(segments[1])
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean)

    if (segments[0] !== 'channel' || !segments[1]) {
      return []
    }

    return [
      {
        uri: `https://www.bitchute.com/feeds/rss/channel/${segments[1]}/`,
        hint: composeHint('bitchute:channel'),
      },
    ]
  },
}
