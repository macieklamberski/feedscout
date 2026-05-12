import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Velog is a Korean SPA at `velog.io` that serves RSS only off-domain at
// `v2.velog.io/rss` (entire/trending feed) and `v2.velog.io/rss/{username}`
// per user; the main `velog.io` host has no `/rss` route and pages render
// client-side with no `<link rel="alternate">` autodiscovery. The handler
// maps `/@{user}` and `/` URLs onto the corresponding `v2.velog.io` feed.

const hosts = ['velog.io', 'www.velog.io']
const userRegex = /^\/@([^/]+)/

export const velogHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const userMatch = pathname.match(userRegex)

    if (userMatch?.[1]) {
      return [
        {
          uri: `https://v2.velog.io/rss/${userMatch[1]}`,
          hint: composeHint('velog:posts'),
        },
      ]
    }

    // Homepage: trending posts feed.
    if (pathname === '/' || pathname === '') {
      return [
        {
          uri: 'https://v2.velog.io/rss',
          hint: composeHint('velog:trending'),
        },
      ]
    }

    return []
  },
}
