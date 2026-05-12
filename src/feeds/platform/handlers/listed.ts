import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Listed (Standard Notes) exposes one RSS 2.0 feed per author at
// `listed.to/@{user}/feed.rss` (with the no-suffix `/feed` route resolving
// to the same controller action). There is no Atom or JSON Feed (both
// return HTTP 500) and no sitewide feed. The "partial" tier reflects
// custom-domain Listed blogs that share the same `/feed` route but aren't
// matched by hostname — generic feed-link sniffing handles those upstream.

const hosts = ['listed.to', 'www.listed.to']
const userRegex = /^\/@([^/]+)/

export const listedHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const userMatch = pathname.match(userRegex)

    if (!userMatch?.[1]) {
      return []
    }

    return [
      {
        uri: `https://listed.to/@${userMatch[1]}/feed.rss`,
        hint: composeHint('listed:blog'),
      },
    ]
  },
}
