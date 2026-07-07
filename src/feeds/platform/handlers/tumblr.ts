import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Tumblr blogs expose `/rss` and `/tagged/{tag}/rss` (RSS 2.0) on every
// `*.tumblr.com` subdomain and on custom domains, and every blog page emits
// `<link rel="alternate" type="application/rss+xml">` pointing at `/rss`. The
// handler covers the subdomain case directly so custom domains can fall
// through to generic autodiscovery; `/feed`, `/atom`, `/likes/rss` and
// `/following/rss` all 404.

export const domains = ['tumblr.com']

const tagRegex = /^\/tagged\/([^/]+)/

export const tumblrHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)

    // Tagged posts: /tagged/{tag}
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      const tag = tagMatch[1]

      return [{ uri: `${origin}/tagged/${tag}/rss`, hint: composeHint('tumblr:tag') }]
    }

    return [{ uri: `${origin}/rss`, hint: composeHint('tumblr:posts') }]
  },
}
