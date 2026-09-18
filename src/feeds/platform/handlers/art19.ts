import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// An Art19 show page maps one to one onto `rss.art19.com/{slug}`.
//
// Derive the feed from the URL in hand and never from where it redirects: a
// show can 302 to a site that mentions no feed at all while the derived feed
// still resolves.

const hosts = ['art19.com', 'www.art19.com']
const showPathRegex = /^\/shows\/([^/]+)/

export const art19Handler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) && showPathRegex.test(new URL(url).pathname)
  },

  resolve: (url) => {
    try {
      const slug = new URL(url).pathname.match(showPathRegex)?.[1]

      if (!slug) {
        return []
      }

      return [{ uri: `https://rss.art19.com/${slug}`, hint: composeHint('art19:show') }]
    } catch {}

    return []
  },
}
