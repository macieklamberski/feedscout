import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// CSDN user blogs at `blog.csdn.net/{user}` expose a per-blog RSS at
// `rss.csdn.net/{user}/rss/map` (with `blog.csdn.net/{user}/rss/list` as a
// 301-redirect alias). The user and homepage HTML carry no
// `<link rel="alternate" type="application/rss+xml">` tag, and historical
// surfaces like `feed.csdn.net` and per-tag/category RSS have all been
// decommissioned, so the URL pattern is undocumented and undiscoverable.
// The handler hardcodes the `rss.csdn.net/.../rss/map` URL with the
// `blog.csdn.net/.../rss/list` redirect target as a fallback.

const userRegex = /^\/([^/]+)/

const hosts = ['blog.csdn.net']

export const csdnHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const userMatch = pathname.match(userRegex)
    const username = userMatch?.[1]

    if (!username) {
      return []
    }

    return [
      {
        uri: [
          `https://rss.csdn.net/${username}/rss/map`,
          `https://blog.csdn.net/${username}/rss/list`,
        ],
        hint: composeHint('csdn:blog'),
      },
    ]
  },
}
