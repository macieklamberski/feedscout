import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['art19.com', 'www.art19.com']
const showPathRegex = /^\/shows\/([^/]+)/i

export const art19Handler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) && showPathRegex.test(new URL(url).pathname)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const slug = pathname.match(showPathRegex)?.[1]

    if (!slug) {
      return []
    }

    return [{ uri: `https://rss.art19.com/${slug}`, hint: composeHint('art19:show') }]
  },
}
